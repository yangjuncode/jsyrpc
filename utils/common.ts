import * as socketTypes from './socket.types'
import { StrPubSub } from 'ypubsub'

export const SocketEvents = [
  'onSocketClose', 'onSocketError', 'onSocketOpen', 'onSocketMessage',
]

export const DEV = process.env.NODE_ENV === 'development'

export function emptyFn() {/* Empty Function */}

export function onSocketMessage(callback: (result: socketTypes.OnSocketMessageCallbackResult) => void): void {
  StrPubSub.subscribe('onSocketMessage', callback)
}

export function onSocketOpen(callback: (result: socketTypes.OnSocketOpenCallbackResult) => void): void {
  StrPubSub.subscribe('onSocketOpen', callback)
}

export function onSocketError(callback: (result: socketTypes.GeneralCallbackResult) => void): void {
  StrPubSub.subscribe('onSocketError', callback)
}

export function onSocketClose(callback: (result: socketTypes.GeneralCallbackResult) => void): void {
  StrPubSub.subscribe('onSocketClose', callback)
}

export function clearSocketEvent() :void {
  SocketEvents.forEach(event => {
    StrPubSub.unsubscribe(event)
  })
}

export enum SocketState {
  CONNECTING = 0,
  OPEN,
  CLOSING,
  CLOSED,
}

let readyState: SocketState | null = null
export const ReadyState = {
  get() {
    return readyState
  },
  set(v: SocketState | null) {
    readyState = v
  },
}

let socketTask: socketTypes.SocketTask | undefined = undefined
export const SocketTask = {
  get() {
    return socketTask
  },
  set(v: socketTypes.SocketTask | undefined) {
    socketTask = v
  },
}

// 设置socket连接状态, 只读
export function proxySocketReadState(socket: socketTypes.IRpcSocket): void {
  Object.defineProperty(socket, 'readyState', {
    get() {
      return readyState
    },
    set(v: any) {
      DEV && console.warn('[readyState] is readonly!', v)
    },
  })
}

// 清除闭包，避免内存泄露
export function clearSocket() {
  socketTask = undefined
  readyState = null
}

export function createSocketTask(ctx: socketTypes.IRpcSocket): socketTypes.SocketTask {
  return {
    send(options: socketTypes.SendSocketMessageOptions): void {
      ctx.sendSocketMessage(options)
    },
    close(options: socketTypes.CloseSocketOptions): void {
      ctx.closeSocket(options)
    },
    onOpen(callback: (result: socketTypes.OnSocketOpenCallbackResult) => void): void {
      ctx.onSocketOpen(callback)
    },
    onClose(callback: (result: any) => void): void {
      ctx.onSocketClose(callback)
    },
    onError(callback: (result: socketTypes.GeneralCallbackResult) => void): void {
      ctx.onSocketError(callback)
    },
    onMessage(callback: (result: socketTypes.OnSocketMessageCallbackResult) => void): void {
      ctx.onSocketMessage(callback)
    },
  }
}
