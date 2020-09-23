import { StrPubSub } from 'ypubsub'
import * as socketTypes from './socket.types'
import {
  onSocketClose,
  onSocketError,
  onSocketMessage,
  onSocketOpen,
  emptyFn,
  proxySocketReadState,
  clearSocket,
  SocketState,
  DEV,
  SocketTask,
  ReadyState,
} from './common'

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
  }
}

declare const wx: wxApi.Wx

// 微信小程序 SebSocket
export function implWxSocket(): socketTypes.IRpcSocket {
  DEV && console.log('implWxSocket')

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
        DEV && console.warn('wx.onSocketClose:', res)
        ReadyState.set(SocketState.CLOSED)
        const result: socketTypes.GeneralCallbackResult = {
          errMsg: res.reason,
        }
        StrPubSub.publish('onSocketClose', result)
      })
      wx.onSocketError((res: socketTypes.GeneralCallbackResult) => {
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
        DEV && console.log('wx.onSocketMessage:', result)
        StrPubSub.publish('onSocketMessage', result)
      })

      ReadyState.set(SocketState.CONNECTING)
      socketTask = wx.connectSocket(options)
      SocketTask.set(socketTask)

      if (options.success || options.fail || options.complete) {
        return socketTask
      }

      return undefined
    },
    sendSocketMessage(options: socketTypes.SendSocketMessageOptions): void {
      wx.sendSocketMessage(options).then(emptyFn)
    },
    closeSocket(options: socketTypes.CloseSocketOptions): void {
      wx.closeSocket(options).then(emptyFn)
    },

    onSocketMessage,
    onSocketOpen,
    onSocketError,
    onSocketClose,
  }

  proxySocketReadState(socket)

  return socket
}
