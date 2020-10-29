import { StrPubSub } from 'ypubsub'
import * as socketTypes from '../utils/socket.types'
import {
  onSocketClose,
  onSocketError,
  onSocketMessage,
  onSocketOpen,
  emptyFn,
  proxySocketReadState,
  clearSocket,
  clearSocketEvent,
  SocketState,
  DEV,
  SocketTask,
  ReadyState,
} from '../utils/common'

declare namespace wxApi {

  interface SocketTaskOnCloseCallbackResult {
    /** 一个数字值表示关闭连接的状态号，表示连接被关闭的原因。 */
    code: number
    /** 一个可读的字符串，表示连接被关闭的原因。 */
    reason: string
  }

  interface Wx {
    getSystemInfo(): any

    connectSocket(options: socketTypes.ConnectSocketOption): socketTypes.SocketTask | undefined

    sendSocketMessage(options: socketTypes.SendSocketMessageOptions): Promise<socketTypes.SendSocketMessageOptions>

    onSocketMessage(callback: (result: socketTypes.OnSocketMessageCallbackResult) => void): void

    onSocketOpen(callback: (result: socketTypes.OnSocketOpenCallbackResult) => void): void

    onSocketError(callback: (result: socketTypes.GeneralCallbackResult) => void): void

    onSocketClose(callback: (result: SocketTaskOnCloseCallbackResult) => void): void

    closeSocket(options: socketTypes.CloseSocketOptions): Promise<socketTypes.CloseSocketOptions>

    onNetworkStatusChange (callback: socketTypes.NetworkStatusChangeCallback): void

    offNetworkStatusChange (callback?: socketTypes.NetworkStatusChangeCallback): void
 }
}

declare const wx: wxApi.Wx

// 微信小程序 SebSocket
export function implSocket(): socketTypes.IRpcSocket {
  DEV && console.log('implWxSocket')

  let isCloseForce = false
  let onNetworkStatusChange: socketTypes.NetworkStatusChangeCallback | null = null

  const socket: socketTypes.IRpcSocket = {
    connectSocket(options: socketTypes.ConnectSocketOption): socketTypes.SocketTask | undefined {
      // 关闭上一个socket连接
      let socketTask = SocketTask.get()
      if (socketTask) {
        socketTask.close({ code: 1000 })
        clearSocket()
      }

      // 处理事件监听
      wx.onSocketClose((res: wxApi.SocketTaskOnCloseCallbackResult) => {
        if (isCloseForce) { return }
        DEV && console.warn('wx.onSocketClose:', res)
        ReadyState.set(SocketState.CLOSED)
        const result: socketTypes.GeneralCallbackResult = {
          errMsg: res.reason,
        }
        StrPubSub.publish('onSocketClose', result)
      })
      wx.onSocketError((res: socketTypes.GeneralCallbackResult) => {
        if (isCloseForce) { return }
        DEV && console.error('wx.onSocketError:', res)
        ReadyState.set(SocketState.CLOSING)
        const result: socketTypes.GeneralCallbackResult = {
          errMsg: res.errMsg,
        }
        StrPubSub.publish('onSocketError', result)
      })
      wx.onSocketOpen((result: socketTypes.OnSocketOpenCallbackResult) => {
        DEV && console.log('wx.onSocketOpen:', result)
        ReadyState.set(SocketState.OPEN)
        StrPubSub.publish('onSocketOpen', result)
      })
      wx.onSocketMessage((result: socketTypes.OnSocketMessageCallbackResult) => {
        if (isCloseForce) { return }
        StrPubSub.publish('onSocketMessage', result)
      })

      isCloseForce = false
      ReadyState.set(SocketState.CONNECTING)
      socketTask = wx.connectSocket(options)
      SocketTask.set(socketTask)

      if (options.success || options.fail || options.complete) {
        return socketTask
      }

      return undefined
    },
    sendSocketMessage(options: socketTypes.SendSocketMessageOptions): void {
      if (isCloseForce) { return }
      wx.sendSocketMessage(options).then(emptyFn)
    },
    closeSocket(options: socketTypes.CloseSocketOptions): void {
      wx.closeSocket(options).then(emptyFn)
    },
    closeSocketForce(options: socketTypes.CloseSocketOptions): void {
      const result: socketTypes.GeneralCallbackResult = {
        errMsg: options.reason ?? 'close force',
      }
      DEV && console.warn('wx.onSocketClose force:', result)
      ReadyState.set(SocketState.CLOSED)
      StrPubSub.publish('onSocketClose', result)

      isCloseForce = true

      this.closeSocket(options)
    },
    onNetworkStatusChange(callback: socketTypes.NetworkStatusChangeCallback): void {
      if (onNetworkStatusChange) { return }
      onNetworkStatusChange = (res: socketTypes.NetworkStatusChangeResult) => {
        DEV && console.log('wx.onNetworkStatusChange:', res)
        callback(res)
      }
      wx.onNetworkStatusChange(onNetworkStatusChange)
    },
    offNetworkStatusChange(): void {
      if (onNetworkStatusChange) {
        wx.offNetworkStatusChange(onNetworkStatusChange)
      } else {
        wx.offNetworkStatusChange()
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
