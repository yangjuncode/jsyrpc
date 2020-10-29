import { StrPubSub } from 'ypubsub'
import base64 from '@protobufjs/base64'
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

declare namespace myApp {
  interface My {
    getSystemInfo(options: any): void;

    connectSocket(options: socketTypes.ConnectSocketOption): socketTypes.SocketTask;

    onSocketOpen(options: (result: socketTypes.OnSocketOpenCallbackResult) => void): void;

    onSocketError(callback: (result: socketTypes.GeneralCallbackResult) => void): void;

    sendSocketMessage(options: socketTypes.SendSocketMessageOptions): void;

    onSocketMessage(callback: (result: socketTypes.OnSocketMessageCallbackResult) => void): void;

    closeSocket(options?: socketTypes.CloseSocketOptions): void;

    onSocketClose(callback: (result: socketTypes.GeneralCallbackResult) => void): void;

    onNetworkStatusChange (callback: socketTypes.NetworkStatusChangeCallback): void

    // 移除socket监听事件
    offSocketClose(callback?: Function): void

    offSocketMessage(callback?: Function): void

    offSocketOpen(callback?: Function): void

    offSocketError(callback?: Function): void

    offNetworkStatusChange (callback?: socketTypes.NetworkStatusChangeCallback): void
  }
}

declare const my: myApp.My

function offSocketEvents() {
  my.offSocketClose()
  my.offSocketMessage()
  my.offSocketOpen()
  my.offSocketError()
}

// 支付宝SebSocket
export function implSocket(): socketTypes.IRpcSocket {
  DEV && console.log('implMySocket')

  let isCloseForce = false
  let onNetworkStatusChange: socketTypes.NetworkStatusChangeCallback | null = null

  const socket: socketTypes.IRpcSocket = {
    connectSocket(options: socketTypes.ConnectSocketOption): socketTypes.SocketTask | undefined {
      // 关闭上一个socket连接
      let socketTask = SocketTask.get()
      if (socketTask) {
        socketTask.close()
        offSocketEvents()
        clearSocket()
      }

      // 处理事件监听
      my.onSocketClose((result: socketTypes.GeneralCallbackResult) => {
        if (isCloseForce) { return }
        DEV && console.warn('my.onSocketClose:', result)
        ReadyState.set(SocketState.CLOSED)
        StrPubSub.publish('onSocketClose', result)
      })
      my.onSocketError((result: socketTypes.GeneralCallbackResult) => {
        if (isCloseForce) { return }
        DEV && console.error('my.onSocketError:', result)
        ReadyState.set(SocketState.CLOSING)
        StrPubSub.publish('onSocketError', result)
      })
      my.onSocketOpen((result: socketTypes.OnSocketOpenCallbackResult) => {
        DEV && console.log('my.onSocketOpen:', result)
        ReadyState.set(SocketState.OPEN)
        StrPubSub.publish('onSocketOpen', result)
      })
      my.onSocketMessage((result: socketTypes.OnSocketMessageCallbackResult) => {
        if (isCloseForce) { return }
        // 将字符串转换为ArrayBuffer
        if (!result.isBuffer) {
          const data = new Uint8Array()
          base64.decode(result.data as string, data, 0)
          result.data = data.buffer
          result.isBuffer = true
        }
        StrPubSub.publish('onSocketMessage', result)
      })

      isCloseForce = false
      ReadyState.set(SocketState.CONNECTING)
      my.connectSocket(options)

      if (options.success || options.fail || options.complete) {
        const socketTask = createSocketTask(this)
        SocketTask.set(socketTask)

        return socketTask
      }

      return undefined
    },
    sendSocketMessage(options: socketTypes.SendSocketMessageOptions): void {
      if (isCloseForce) { return }
      // 将二进制数据编译成base64字符串
      const data = new Uint8Array(options.data as ArrayBuffer)
      options.data = base64.encode(data, 0, data.length)
      options.isBuffer = true
      my.sendSocketMessage(options)
    },
    closeSocket(options: socketTypes.CloseSocketOptions): void {
      my.closeSocket(options)
    },
    closeSocketForce(options: socketTypes.CloseSocketOptions): void {
      ReadyState.set(SocketState.CLOSED)
      const result: socketTypes.GeneralCallbackResult = {
        errMsg: options.reason ?? 'close force',
      }
      DEV && console.warn('my.onSocketClose force:', result)
      StrPubSub.publish('onSocketClose', result)

      isCloseForce = true

      offSocketEvents()
      this.closeSocket(options)
    },
    onNetworkStatusChange(callback: socketTypes.NetworkStatusChangeCallback): void {
      if (onNetworkStatusChange) { return }
      onNetworkStatusChange = (res: socketTypes.NetworkStatusChangeResult) => {
        DEV && console.log('my.onNetworkStatusChange:', res)
        callback(res)
      }
      my.onNetworkStatusChange(onNetworkStatusChange)
    },
    offNetworkStatusChange(): void {
      if (onNetworkStatusChange) { 
        my.offNetworkStatusChange(onNetworkStatusChange)
      } else {
        my.offNetworkStatusChange()
      }
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
