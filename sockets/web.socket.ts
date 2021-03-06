import { StrPubSub } from 'ypubsub'
import * as socketTypes from '../utils/socket.types'
import {
  onSocketClose,
  onSocketError,
  onSocketMessage,
  onSocketOpen,
  proxySocketReadState,
  clearSocket,
  createSocketTask,
  clearSocketEvent,
  SocketState,
  DEV,
  SocketTask,
  ReadyState,
} from '../utils/common'

type callbackOptions = socketTypes.SendSocketMessageOptions | socketTypes.CloseSocketOptions

// 处理WebSocket接口
export function implSocket(): socketTypes.IRpcSocket {
  DEV && console.log('implWebSocket')
  let ws: WebSocket | null = null
  let isCloseForce = false
  let onNetworkStatusChange: (() => void) | null = null

  const execWsCmd = (fn: (ws: WebSocket) => void, options: callbackOptions) => {
    const result: socketTypes.GeneralCallbackResult = {
      errMsg: '',
    }
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      result.errMsg = 'WebSocket not init'
      options.fail?.(result)
      return
    }

    try {
      fn(ws)
      result.errMsg = 'success'
      options.success?.(result)
    } catch (e) {
      result.errMsg = 'fail:' + e.toString()
      options.fail?.(result)
    } finally {
      result.errMsg = 'complete'
      options.complete?.(result)
    }
  }

  const socket: socketTypes.IRpcSocket = {
    connectSocket(options: socketTypes.ConnectSocketOption): socketTypes.SocketTask | undefined {
      if (ws) {
        ws.onerror = null
        ws.onclose = null
        ws.close(1000)
        ws = null
        clearSocket()
      }

      // 初始化WebSocket
      isCloseForce = false
      ReadyState.set(SocketState.CONNECTING)
      ws = new WebSocket(options.url)
      ws.binaryType = 'arraybuffer'

      // 处理事件监听
      ws.onclose = (ev: CloseEvent) => {
        if (isCloseForce) { return }
        DEV && console.warn('ws.onclose:', ev)
        ReadyState.set(SocketState.CLOSED)
        const result: socketTypes.GeneralCallbackResult = {
          errMsg: ev.reason,
        }
        StrPubSub.publish('onSocketClose', result)
      }
      ws.onerror = (ev: Event) => {
        if (isCloseForce) { return }
        DEV && console.error('ws.onerror:', ev)
        ReadyState.set(SocketState.CLOSING)
        const result: socketTypes.GeneralCallbackResult = {
          errMsg: (ev.target as WebSocket).url,
        }
        StrPubSub.publish('onSocketError', result)
      }
      ws.onopen = (ev: Event) => {
        DEV && console.log('ws.onopen:', ev)
        ReadyState.set(SocketState.OPEN)
        const result: socketTypes.OnSocketOpenCallbackResult = {}
        StrPubSub.publish('onSocketOpen', result)
      }
      ws.onmessage = (ev: MessageEvent) => {
        if (isCloseForce) { return }
        const result: socketTypes.OnSocketMessageCallbackResult = {
          data: ev.data,
        }
        StrPubSub.publish('onSocketMessage', result)
      }

      if (options.success || options.fail || options.complete) {
        const socketTask = createSocketTask(this)
        SocketTask.set(socketTask)

        return socketTask
      }

      return undefined
    },
    sendSocketMessage(options: socketTypes.SendSocketMessageOptions): void {
      if (isCloseForce) { return }
      execWsCmd((ws: WebSocket) => {
        ws.send(options.data)
      }, options)
    },
    closeSocket(options: socketTypes.CloseSocketOptions): void {
      execWsCmd((ws: WebSocket) => {
        ws.close(options.code, options.reason)
      }, options)
    },
    closeSocketForce(options: socketTypes.CloseSocketOptions): void {
      if (ws) {
        ReadyState.set(SocketState.CLOSED)
        const result: socketTypes.GeneralCallbackResult = {
          errMsg: options.reason ?? 'close force',
        }
        DEV && console.warn('ws.onclose force:', result)
        StrPubSub.publish('onSocketClose', result)

        isCloseForce = true

        ws.onerror = null
        ws.onclose = null
      }
      this.closeSocket(options)
    },
    onNetworkStatusChange(callback: socketTypes.NetworkStatusChangeCallback): void {
      if (onNetworkStatusChange) { return }

      const getNetworkType: () => string = () => {
        // @ts-ignore
        const connection = navigator.connection
        const unknown = 'unknown'
        if (!connection) { return unknown }
        return connection.effectiveType || unknown
      }
      onNetworkStatusChange = () => {
        const res: socketTypes.NetworkStatusChangeResult = {
          isConnected: navigator.onLine,
          networkType: getNetworkType()
        }
        DEV && console.log('ws.onNetworkStatusChange:', res)
        callback(res)
      }

      window.addEventListener('online', onNetworkStatusChange)
      window.addEventListener('offline', onNetworkStatusChange)
    },
    offNetworkStatusChange(): void {
      if (!onNetworkStatusChange) { return }
      window.removeEventListener('online', onNetworkStatusChange)
      window.removeEventListener('offline', onNetworkStatusChange)
      onNetworkStatusChange = null
    },

    onSocketMessage,
    onSocketOpen,
    onSocketError,
    onSocketClose,
    clearSocketEvent,
  }

  proxySocketReadState(socket)

  return socket
}
