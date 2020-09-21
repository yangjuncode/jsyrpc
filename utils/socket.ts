import { getEnv, ENV_TYPE } from './env'

const DEV = process.env.NODE_ENV === 'development'
const env = getEnv()
DEV && console.log('jsyrpc env:', env)

export interface ConnectSocketOption {
  /**
   * 开发者服务器接口地址，必须是 wss 协议，且域名必须是后台配置的合法域名
   */
  url: string
  /**
   * HTTP 请求 Header，header 中不能设置 Referer
   */
  header?: any
  /**
   * 子协议数组
   */
  protocols?: string []
  /**
   * 超时时间，单位为毫秒
   */
  timeout?: number
  /**
   * 建立 TCP 连接的时候的 TCP_NODELAY 设置
   */
  tcpNoDelay?: boolean
  /**
   * 是否开启压缩扩展
   */
  perMessageDeflate?: boolean
  /**
   * 接口调用成功的回调函数
   */
  success?: (result: any) => void
  /**
   * 接口调用失败的回调函数
   */
  fail?: (result: any) => void
  /**
   * 接口调用结束的回调函数（调用成功、失败都会执行）
   */
  complete?: (result: any) => void
}

export interface GeneralCallbackResult {
  /**
   * 错误信息
   */
  errMsg: string
}

export interface SendSocketMessageOptions {
  /**
   * 需要发送的内容
   */
  data: string | ArrayBuffer
  /**
   * 接口调用成功的回调函数
   */
  success?: (result: GeneralCallbackResult) => void
  /**
   * 接口调用失败的回调函数
   */
  fail?: (result: GeneralCallbackResult) => void
  /**
   * 接口调用结束的回调函数（调用成功、失败都会执行）
   */
  complete?: (result: GeneralCallbackResult) => void
}

export interface OnSocketMessageCallbackResult {
  /**
   * 服务器返回的消息
   */
  data: string | ArrayBuffer
}

export interface OnSocketOpenCallbackResult {
  /**
   * 连接成功的 HTTP 响应 Header
   */
  header: any
}

export interface CloseSocketOptions {
  /**
   * 一个数字值表示关闭连接的状态号，表示连接被关闭的原因。如果这个参数没有被指定，默认的取值是1000 （表示正常连接关闭）
   */
  code?: number
  /**
   * 一个可读的字符串，表示连接被关闭的原因。这个字符串必须是不长于123字节的UTF-8 文本（不是字符）
   */
  reason?: string
  /**
   * 接口调用成功的回调函数
   */
  success?: (result: GeneralCallbackResult) => void
  /**
   * 接口调用失败的回调函数
   */
  fail?: (result: GeneralCallbackResult) => void
  /**
   * 接口调用结束的回调函数（调用成功、失败都会执行）
   */
  complete?: (result: GeneralCallbackResult) => void
}

export interface SocketTask {
  /**
   * 通过 WebSocket 连接发送数据
   */
  send(options: SendSocketMessageOptions): void;

  /**
   * 关闭 WebSocket 连接
   */
  close(options: CloseSocketOptions): void;

  /**
   * 监听 WebSocket 连接打开事件
   */
  onOpen(callback: (result: OnSocketOpenCallbackResult) => void): void;

  /**
   * 监听 WebSocket 连接关闭事件
   */
  onClose(callback: (result: any) => void): void;

  /**
   * 监听 WebSocket 错误
   */
  onError(callback: (result: GeneralCallbackResult) => void): void;

  /**
   * 监听WebSocket接受到服务器的消息事件
   */
  onMessage(callback: (result: OnSocketMessageCallbackResult) => void): void;
}

export interface IRpcSocket {
  [key: string]: any

  connectSocket(options: ConnectSocketOption): SocketTask | undefined

  sendSocketMessage(options: SendSocketMessageOptions): void

  onSocketMessage(callback: (result: OnSocketMessageCallbackResult) => void): void

  onSocketOpen(callback: (result: OnSocketOpenCallbackResult) => void): void

  onSocketError(callback: (result: GeneralCallbackResult) => void): void

  onSocketClose(callback: (result: GeneralCallbackResult) => void): void

  closeSocket(options: CloseSocketOptions): void
}

// const connectSocket = (() => {
//   let socket
//
//   function connectSocket(options: ConnectSocketOption): SocketTask | undefined {
//   }
//
//   return connectSocket
// })()

export enum SocketState {
  CONNECTING = 0,
  OPEN,
  CLOSING,
  CLOSED,
}

// 在web浏览器环境下，使用该socket实例进行数据传输
let socket: any

// export const Socket: IRpcSocket = {
//   readyState: SocketState.CLOSED,
//   connectSocket(options: ConnectSocketOption): SocketTask | undefined {
//     // return connectSocket.call(Socket, options)
//     if (socket) {
//       Socket.closeSocket({
//         code: 1000,
//       })
//     }
//
//     this.readyState = SocketState.CONNECTING
//
//     // 浏览器环境
//     if (typeof window !== 'undefined') {
//       socket = new window.WebSocket(options.url)
//       socket.binaryType = 'arraybuffer'
//     }
//
//     if (options.success || options.fail || options.complete) {
//       const socketTask: SocketTask = {
//         send(options: SendSocketMessageOptions): void { },
//         close(options: CloseSocketOptions): void {},
//         onOpen(callback: (result: OnSocketOpenCallbackResult) => void): void {},
//         onClose(callback: (result: any) => void): void {},
//         onError(callback: (result: GeneralCallbackResult) => void): void {},
//         onMessage(callback: (result: OnSocketMessageCallbackResult) => void): void {},
//       }
//
//       return socketTask
//     }
//
//   },
//
//   sendSocketMessage(options: SendSocketMessageOptions): void {},
//
//   onSocketMessage(callback: (result: OnSocketMessageCallbackResult) => void): void {},
//
//   onSocketOpen(callback: (result: OnSocketOpenCallbackResult) => void): void {
//     this.readyState = SocketState.OPEN
//   },
//
//   onSocketError(callback: (result: GeneralCallbackResult) => void): void {
//     this.readyState = SocketState.CLOSING
//   },
//
//   onSocketClose(callback: (result: GeneralCallbackResult) => void): void {
//     this.readyState = SocketState.CLOSED
//   },
//
//   closeSocket(options: CloseSocketOptions): void {
//
//   },
// }

function rpcSocketImpl(): IRpcSocket {
  const callbacks: Map<string, Function> = new Map<string, Function>()
  const readyState: SocketState = SocketState.CLOSED

  let ws: WebSocket | null = null

  const socket: IRpcSocket = {
    readyState: SocketState.CLOSED,
    connectSocket(options: ConnectSocketOption): SocketTask | undefined {
      if (ws) {
        ws.close(1000)
      }

      // 初始化WebSocket
      ws = new WebSocket(options.url)
      ws.binaryType = 'arraybuffer'

      // 处理事件监听
      ws.onclose = (ev: CloseEvent) => {
        const cb = this.callbacks.get('onSocketClose')
        const result: GeneralCallbackResult = {
          errMsg: ev.reason,
        }
        cb && cb(result)
      }

      return undefined
    },

    sendSocketMessage(options: SendSocketMessageOptions): void {},

    onSocketMessage(callback: (result: OnSocketMessageCallbackResult) => void): void {
      this.callbacks.set('onSocketMessage', callback)
    },

    onSocketOpen(callback: (result: OnSocketOpenCallbackResult) => void): void {
      this.readyState = SocketState.OPEN
      this.callbacks.set('onSocketOpen', callback)
    },

    onSocketError(callback: (result: GeneralCallbackResult) => void): void {
      this.readyState = SocketState.CLOSING
      this.callbacks.set('onSocketError', callback)
    },

    onSocketClose(callback: (result: GeneralCallbackResult) => void): void {
      this.readyState = SocketState.CLOSED
      this.callbacks.set('onSocketClose', callback)
    },

    closeSocket(options: CloseSocketOptions): void {

    },
  }

  return socket
}

// 优先判断是否多端环境，多端环境下，框架已经实现统一的WebSocket接口
function getRpcSocket(): IRpcSocket {
  // 多端环境
  if (env === ENV_TYPE.UNI) {
    // @ts-ignore
    return uni
  }
  if (env === ENV_TYPE.TARO) {
    // @ts-ignore
    return taro
  }

  // 浏览器环境
  if (typeof window !== 'undefined') {
    return rpcSocketImpl()
  }

  throw new Error('not impl rpc socket!!! env: ' + env)
}

export const rpcSocket = getRpcSocket()

export default rpcSocket
