import { getEnv, ENV_TYPE } from './env'
import { StrPubSub } from 'ypubsub'

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
  header?: any
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
  send(options: SendSocketMessageOptions): void

  /**
   * 关闭 WebSocket 连接
   */
  close(options: CloseSocketOptions): void

  /**
   * 监听 WebSocket 连接打开事件
   */
  onOpen(callback: (result: OnSocketOpenCallbackResult) => void): void

  /**
   * 监听 WebSocket 连接关闭事件
   */
  onClose(callback: (result: any) => void): void

  /**
   * 监听 WebSocket 错误
   */
  onError(callback: (result: GeneralCallbackResult) => void): void

  /**
   * 监听WebSocket接受到服务器的消息事件
   */
  onMessage(callback: (result: OnSocketMessageCallbackResult) => void): void
}

export interface IRpcSocket {
  readyState?: number

  connectSocket(options: ConnectSocketOption): SocketTask | undefined

  sendSocketMessage(options: SendSocketMessageOptions): void

  onSocketMessage(callback: (result: OnSocketMessageCallbackResult) => void): void

  onSocketOpen(callback: (result: OnSocketOpenCallbackResult) => void): void

  onSocketError(callback: (result: GeneralCallbackResult) => void): void

  onSocketClose(callback: (result: GeneralCallbackResult) => void): void

  closeSocket(options: CloseSocketOptions): void
}

export enum SocketState {
  CONNECTING = 0,
  OPEN,
  CLOSING,
  CLOSED,
}

type callbackOptions = SendSocketMessageOptions | CloseSocketOptions

const SocketEvents = [
  'onSocketClose', 'onSocketError', 'onSocketOpen', 'onSocketMessage',
]
let socketTask: SocketTask | undefined = undefined
let readyState: SocketState | null = null

function emptyFn() {/* Empty Function */}

function onSocketMessage(callback: (result: OnSocketMessageCallbackResult) => void): void {
  StrPubSub.subscribe('onSocketMessage', callback)
}

function onSocketOpen(callback: (result: OnSocketOpenCallbackResult) => void): void {
  StrPubSub.subscribe('onSocketOpen', callback)
}

function onSocketError(callback: (result: GeneralCallbackResult) => void): void {
  StrPubSub.subscribe('onSocketError', callback)
}

function onSocketClose(callback: (result: GeneralCallbackResult) => void): void {
  StrPubSub.subscribe('onSocketClose', callback)
}

// 设置socket连接状态, 只读
function proxySocketReadState(socket: IRpcSocket): void {
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
function clearSocket() {
  socketTask = undefined
  readyState = null
  SocketEvents.forEach(event => {
    StrPubSub.unsubscribe(event)
  })
}

declare namespace uniApp {
  interface Uni {
    getSystemInfo(options: any): void;

    connectSocket(options: ConnectSocketOption): SocketTask;

    onSocketOpen(options: (result: OnSocketOpenCallbackResult) => void): void;

    onSocketError(callback: (result: GeneralCallbackResult) => void): void;

    sendSocketMessage(options: SendSocketMessageOptions): void;

    onSocketMessage(callback: (result: OnSocketMessageCallbackResult) => void): void;

    closeSocket(options: CloseSocketOptions): void;

    onSocketClose(callback: (result: GeneralCallbackResult) => void): void;
  }
}

declare const uni: uniApp.Uni

// 处理uni-app多端框架SebSocket
function rpcUniAppSocketImpl(): IRpcSocket {
  DEV && console.log('rpcUniAppSocketImpl')

  const socket: IRpcSocket = {
    connectSocket(options: ConnectSocketOption): SocketTask | undefined {
      // 关闭上一个socket连接
      if (socketTask) {
        (socketTask as SocketTask).close({ code: 1000 })
        clearSocket()
      }

      // 处理事件监听
      uni.onSocketClose((result: GeneralCallbackResult) => {
        DEV && console.warn('uni.onSocketClose:', result)
        readyState = SocketState.CLOSED
        StrPubSub.publish('onSocketClose', result)
      })
      uni.onSocketError((result: GeneralCallbackResult) => {
        DEV && console.error('uni.onSocketError:', result)
        readyState = SocketState.CLOSING
        StrPubSub.publish('onSocketError', result)
      })
      uni.onSocketOpen((result: OnSocketOpenCallbackResult) => {
        DEV && console.log('uni.onSocketOpen:', result)
        readyState = SocketState.OPEN
        StrPubSub.publish('onSocketOpen', result)
      })
      uni.onSocketMessage((result: OnSocketMessageCallbackResult) => {
        DEV && console.log('uni.onSocketMessage:', result)
        StrPubSub.publish('onSocketMessage', result)
      })

      readyState = SocketState.CONNECTING
      socketTask = uni.connectSocket(options)

      if (options.success || options.fail || options.complete) {
        return socketTask
      }

      return undefined
    },
    sendSocketMessage(options: SendSocketMessageOptions): void {
      uni.sendSocketMessage(options)
    },
    closeSocket(options: CloseSocketOptions): void {
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

// 处理WebSocket接口
function rpcWebSocketImpl(): IRpcSocket {
  DEV && console.log('rpcWebSocketImpl')
  let ws: WebSocket | null = null
  const execWsCmd = (fn: (ws: WebSocket) => void, options: callbackOptions) => {
    const result: GeneralCallbackResult = {
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

  const socket: IRpcSocket = {
    connectSocket(options: ConnectSocketOption): SocketTask | undefined {
      if (ws) {
        ws.close(1000)
        ws = null
        clearSocket()
      }

      // 初始化WebSocket
      readyState = SocketState.CONNECTING
      ws = new WebSocket(options.url)
      ws.binaryType = 'arraybuffer'

      // 处理事件监听
      ws.onclose = (ev: CloseEvent) => {
        DEV && console.warn('ws.onclose:', ev)
        readyState = SocketState.CLOSED
        const result: GeneralCallbackResult = {
          errMsg: ev.reason,
        }
        StrPubSub.publish('onSocketClose', result)
      }
      ws.onerror = (ev: Event) => {
        DEV && console.error('ws.onerror:', ev)
        readyState = SocketState.CLOSING
        const result: GeneralCallbackResult = {
          errMsg: (ev.target as WebSocket).url,
        }
        StrPubSub.publish('onSocketError', result)
      }
      ws.onopen = (ev: Event) => {
        DEV && console.log('ws.onopen:', ev)
        readyState = SocketState.OPEN
        const result: OnSocketOpenCallbackResult = {}
        StrPubSub.publish('onSocketOpen', result)
      }
      ws.onmessage = (ev: MessageEvent) => {
        DEV && console.log('ws.onmessage:', ev)
        const result: OnSocketMessageCallbackResult = {
          data: ev.data,
        }
        StrPubSub.publish('onSocketMessage', result)
      }

      if (options.success || options.fail || options.complete) {
        const that = this
        socketTask = {
          send(options: SendSocketMessageOptions): void {
            that.sendSocketMessage(options)
          },
          close(options: CloseSocketOptions): void {
            that.closeSocket(options)
          },
          onOpen(callback: (result: OnSocketOpenCallbackResult) => void): void {
            that.onSocketOpen(callback)
          },
          onClose(callback: (result: any) => void): void {
            that.onSocketClose(callback)
          },
          onError(callback: (result: GeneralCallbackResult) => void): void {
            that.onSocketError(callback)
          },
          onMessage(callback: (result: OnSocketMessageCallbackResult) => void): void {
            that.onSocketMessage(callback)
          },
        }
        return socketTask
      }

      return undefined
    },
    sendSocketMessage(options: SendSocketMessageOptions): void {
      execWsCmd((ws: WebSocket) => {
        ws.send(options.data)
      }, options)
    },
    closeSocket(options: CloseSocketOptions): void {
      execWsCmd((ws: WebSocket) => {
        ws.close(options.code, options.reason)
      }, options)
    },

    onSocketMessage,
    onSocketOpen,
    onSocketError,
    onSocketClose,
  }

  proxySocketReadState(socket)

  return socket
}

declare namespace wxApi {

  interface SocketTaskOnCloseCallbackResult {
    /** 一个数字值表示关闭连接的状态号，表示连接被关闭的原因。 */
    code: number
    /** 一个可读的字符串，表示连接被关闭的原因。 */
    reason: string
  }

  interface Wx {
    getSystemInfo(): any

    connectSocket(options: ConnectSocketOption): SocketTask | undefined

    sendSocketMessage(options: SendSocketMessageOptions): Promise<SendSocketMessageOptions>

    onSocketMessage(callback: (result: OnSocketMessageCallbackResult) => void): void

    onSocketOpen(callback: (result: OnSocketOpenCallbackResult) => void): void

    onSocketError(callback: (result: GeneralCallbackResult) => void): void

    onSocketClose(callback: (result: SocketTaskOnCloseCallbackResult) => void): void

    closeSocket(options: CloseSocketOptions): Promise<CloseSocketOptions>
  }
}

declare const wx: wxApi.Wx

// 微信小程序 SebSocket
function rpcWxSocketImpl(): IRpcSocket {
  DEV && console.log('rpcWxSocketImpl')

  const socket: IRpcSocket = {
    connectSocket(options: ConnectSocketOption): SocketTask | undefined {
      // 关闭上一个socket连接
      if (socketTask) {
        (socketTask as SocketTask).close({ code: 1000 })
        clearSocket()
      }

      // 处理事件监听
      wx.onSocketClose((res: wxApi.SocketTaskOnCloseCallbackResult) => {
        DEV && console.warn('uni.onSocketClose:', res)
        readyState = SocketState.CLOSED
        const result: GeneralCallbackResult = {
          errMsg: res.reason,
        }
        StrPubSub.publish('onSocketClose', result)
      })
      wx.onSocketError((res: GeneralCallbackResult) => {
        DEV && console.error('uni.onSocketError:', res)
        readyState = SocketState.CLOSING
        const result: GeneralCallbackResult = {
          errMsg: res.errMsg,
        }
        StrPubSub.publish('onSocketError', result)
      })
      wx.onSocketOpen((res: OnSocketOpenCallbackResult) => {
        DEV && console.log('uni.onSocketOpen:', res)
        readyState = SocketState.OPEN
        const result: OnSocketOpenCallbackResult = {
          ...res,
        }
        StrPubSub.publish('onSocketOpen', result)
      })
      wx.onSocketMessage((res: OnSocketMessageCallbackResult) => {
        DEV && console.log('uni.onSocketMessage:', res)
        const result: OnSocketMessageCallbackResult = {
          ...res,
        }
        StrPubSub.publish('onSocketMessage', result)
      })

      readyState = SocketState.CONNECTING
      socketTask = wx.connectSocket(options)

      if (options.success || options.fail || options.complete) {
        return socketTask
      }

      return undefined
    },
    sendSocketMessage(options: SendSocketMessageOptions): void {
      wx.sendSocketMessage(options).then(emptyFn)
    },
    closeSocket(options: CloseSocketOptions): void {
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

// 优先判断是否多端环境，多端环境下，框架已经实现统一的WebSocket接口
function getRpcSocket(): IRpcSocket {
  // 多端环境
  if (env === ENV_TYPE.UNI) {
    return rpcUniAppSocketImpl()
  }
  if (env === ENV_TYPE.TARO) {
    // @ts-ignore
    return taro
  }

  // 浏览器环境(非多端浏览器环境)
  if (env === ENV_TYPE.WEB) {
    return rpcWebSocketImpl()
  }

  // 各类小程序环境
  // 微信小程序
  if (env === ENV_TYPE.WX) {
    return rpcWxSocketImpl()
  }
  // 支付宝小程序
  if (env === ENV_TYPE.MY) {
    // @ts-ignore
    return taro
  }

  throw new Error('not impl rpc socket!!! env: ' + env)
}

export const rpcSocket = getRpcSocket()
