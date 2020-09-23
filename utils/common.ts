import * as socketTypes from 'utils/socket.types'
import { StrPubSub } from 'ypubsub'

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

export enum SocketState {
  CONNECTING = 0,
  OPEN,
  CLOSING,
  CLOSED,
}

export const SocketEvents = [
  'onSocketClose', 'onSocketError', 'onSocketOpen', 'onSocketMessage',
]

export const DEV = process.env.NODE_ENV === 'development'

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
      DEV && console.warn('[readyState] is readonly!')
    },
  })
}

// 清除闭包，避免内存泄露
export function clearSocket() {
  socketTask = undefined
  readyState = null
  SocketEvents.forEach(event => {
    StrPubSub.unsubscribe(event)
  })
}
