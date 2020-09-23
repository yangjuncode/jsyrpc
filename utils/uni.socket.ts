import { StrPubSub } from 'ypubsub'
import * as socketTypes from 'utils/socket.types'
import {
  onSocketClose,
  onSocketError,
  onSocketMessage,
  onSocketOpen,
  proxySocketReadState,
  clearSocket,
  SocketState,
  DEV,
  SocketTask,
  ReadyState,
} from 'utils/common'

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
export function implUniSocket(): socketTypes.IRpcSocket {
  DEV && console.log('implUniSocket')

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
        DEV && console.warn('uni.onSocketClose:', result)
        ReadyState.set(SocketState.CLOSED)
        StrPubSub.publish('onSocketClose', result)
      })
      uni.onSocketError((result: socketTypes.GeneralCallbackResult) => {
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
        DEV && console.log('uni.onSocketMessage:', result)
        StrPubSub.publish('onSocketMessage', result)
      })

      ReadyState.set(SocketState.CONNECTING)
      socketTask = uni.connectSocket(options)
      SocketTask.set(socketTask)

      if (options.success || options.fail || options.complete) {
        return socketTask
      }

      return undefined
    },
    sendSocketMessage(options: socketTypes.SendSocketMessageOptions): void {
      uni.sendSocketMessage(options)
    },
    closeSocket(options: socketTypes.CloseSocketOptions): void {
      uni.closeSocket(options)
    },

    onSocketMessage,
    onSocketOpen,
    onSocketError,
    onSocketClose,
  }

  proxySocketReadState(socket)

  return socket
}
