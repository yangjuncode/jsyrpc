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

    // 移动socket监听事件
    offSocketClose(callback?: Function): void

    offSocketMessage(callback?: Function): void

    offSocketOpen(callback?: Function): void

    offSocketError(callback?: Function): void
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
        DEV && console.warn('my.onSocketClose:', result)
        ReadyState.set(SocketState.CLOSED)
        StrPubSub.publish('onSocketClose', result)
      })
      my.onSocketError((result: socketTypes.GeneralCallbackResult) => {
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
        DEV && console.log('my.onSocketMessage:', result)
        // 将字符串转换为ArrayBuffer
        if (!result.isBuffer) {
          const data = new Uint8Array()
          base64.decode(result.data as string, data, 0)
          result.data = data.buffer
          result.isBuffer = true
        }
        StrPubSub.publish('onSocketMessage', result)
      })

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
      // 将二进制数据编译成base64字符串
      const data = new Uint8Array(options.data as ArrayBuffer)
      options.data = base64.encode(data, 0, data.length)
      options.isBuffer = true
      my.sendSocketMessage(options)
    },
    closeSocket(options: socketTypes.CloseSocketOptions): void {
      my.closeSocket(options)
    },

    onSocketMessage,
    onSocketOpen,
    onSocketError,
    onSocketClose,
  }

  proxySocketReadState(socket)

  return socket
}
