import { StrPubSub } from 'ypubsub'
import * as socketTypes from '../utils/socket.types'
import {
  onSocketClose,
  onSocketError,
  onSocketMessage,
  onSocketOpen,
  proxySocketReadState,
  clearSocket,
  clearSocketEvent,
  SocketState,
  DEV,
  SocketTask,
  ReadyState,
} from '../utils/common'

declare namespace uniApp {
  interface Uni {
    getSystemInfo(options: any): void;

    connectSocket(options: socketTypes.ConnectSocketOption): socketTypes.SocketTask;

    onSocketOpen(options: (result: socketTypes.OnSocketOpenCallbackResult) => void): void;

    onSocketError(callback: (result: socketTypes.GeneralCallbackResult) => void): void;

    sendSocketMessage(options: socketTypes.SendSocketMessageOptions): void;

    onSocketMessage(callback: (result: socketTypes.OnSocketMessageCallbackResult) => void): void;

    closeSocket(options: socketTypes.CloseSocketOptions): void;

    onSocketClose(callback: (result: socketTypes.GeneralCallbackResult) => void): void;
  }
}

declare const uni: uniApp.Uni

// 处理uni-app多端框架SebSocket
export function implSocket(): socketTypes.IRpcSocket {
  DEV && console.log('implUniSocket')

  let  isCloseForce = false

  const socket: socketTypes.IRpcSocket = {
    connectSocket(options: socketTypes.ConnectSocketOption): socketTypes.SocketTask | undefined {
      // 关闭上一个socket连接
      let socketTask = SocketTask.get()
      if (socketTask) {
        socketTask.close({ code: 1000 })
        clearSocket()
      }

      // 处理事件监听
      uni.onSocketClose((result: socketTypes.GeneralCallbackResult) => {
        if (isCloseForce) { return }
        DEV && console.warn('uni.onSocketClose:', result)
        ReadyState.set(SocketState.CLOSED)
        StrPubSub.publish('onSocketClose', result)
      })
      uni.onSocketError((result: socketTypes.GeneralCallbackResult) => {
        if (isCloseForce) { return }
        DEV && console.error('uni.onSocketError:', result)
        ReadyState.set(SocketState.CLOSING)
        StrPubSub.publish('onSocketError', result)
      })
      uni.onSocketOpen((result: socketTypes.OnSocketOpenCallbackResult) => {
        DEV && console.log('uni.onSocketOpen:', result)
        ReadyState.set(SocketState.OPEN)
        StrPubSub.publish('onSocketOpen', result)
      })
      uni.onSocketMessage((result: socketTypes.OnSocketMessageCallbackResult) => {
        if (isCloseForce) { return }
        StrPubSub.publish('onSocketMessage', result)
      })

      isCloseForce = false
      ReadyState.set(SocketState.CONNECTING)
      socketTask = uni.connectSocket(options)
      SocketTask.set(socketTask)

      if (options.success || options.fail || options.complete) {
        return socketTask
      }

      return undefined
    },
    sendSocketMessage(options: socketTypes.SendSocketMessageOptions): void {
      if (isCloseForce) { return }
      uni.sendSocketMessage(options)
    },
    closeSocket(options: socketTypes.CloseSocketOptions): void {
      uni.closeSocket(options)
    },
    closeSocketForce(options: socketTypes.CloseSocketOptions): void {
      const result: socketTypes.GeneralCallbackResult = {
        errMsg: options.reason ?? 'close force',
      }
      DEV && console.warn('uni.onSocketClose force:', result)
      ReadyState.set(SocketState.CLOSED)
      StrPubSub.publish('onSocketClose', result)

      isCloseForce = true

      this.closeSocket(options)
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
