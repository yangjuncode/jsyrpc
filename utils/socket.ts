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

type callbackOptions = SendSocketMessageOptions | CloseSocketOptions

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
  readonly readyState: SocketState

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

function rpcSocketImpl(): IRpcSocket {
  const callbacks: Map<string, Function[]> = new Map<string, Function[]>()
  let readyState: SocketState = SocketState.CLOSED
  let ws: WebSocket | null = null
  const execWsGeneralFn = (ws: WebSocket | null, fn: (ws: WebSocket) => void, options: callbackOptions) => {
    if (!ws) {
      options.fail?.({
        errMsg: 'WebSocket not init!',
      } as GeneralCallbackResult)
      return
    }

    try {
      fn(ws)
      options.success?.({
        errMsg: 'success',
      } as GeneralCallbackResult)
    } catch (e) {
      options.fail?.({
        errMsg: 'fail:' + e.toString(),
      } as GeneralCallbackResult)
    } finally {
      options.complete?.({
        errMsg: 'complete',
      } as GeneralCallbackResult)
    }
  }
  const setCallback = (event: string, callback: Function) => {
    const cbs = callbacks.get(event)
    const newCbs = cbs? cbs.concat([callback]): [callback]
    callbacks.set(event, newCbs)
  }

  const socket: IRpcSocket = {
    readyState: SocketState.CONNECTING,
    connectSocket(options: ConnectSocketOption): SocketTask | undefined {
      if (ws) {
        ws.close(1000)
        ws = null
        callbacks.clear()
      }

      // 初始化WebSocket
      readyState = SocketState.CONNECTING
      ws = new WebSocket(options.url)
      ws.binaryType = 'arraybuffer'

      // 处理事件监听
      ws.onclose = (ev: CloseEvent) => {
        DEV && console.warn('ws.onclose:', ev)
        const cbs = callbacks.get('onSocketClose')
        cbs && cbs.forEach(cb => {
          const result: GeneralCallbackResult = {
            errMsg: ev.reason,
          }
          cb(result)
        })
      }
      ws.onerror = (ev: Event) => {
        DEV && console.error('ws.onerror:', ev)
        const cbs = callbacks.get('onSocketError')
        cbs && cbs.forEach(cb => {
          const result: GeneralCallbackResult = {
            errMsg: (ev.target as WebSocket).url,
          }
          cb(result)
        })
      }
      ws.onopen = (ev: Event) => {
        DEV && console.log('ws.onopen:', ev)
        const cbs = callbacks.get('onSocketOpen')
        cbs && cbs.forEach(cb => {
          const result: OnSocketOpenCallbackResult = {
            header: null,
          }
          cb(result)
        })
      }
      ws.onmessage = (ev: MessageEvent) => {
        DEV && console.log('ws.onmessage:', ev)
        const cbs = callbacks.get('onSocketMessage')
        cbs && cbs.forEach(cb => {
          const result: OnSocketMessageCallbackResult = {
            ...ev,
            data: ev.data,
          }
          cb(result)
        })
      }

      if (options.success || options.fail || options.complete) {
        const socketTask: SocketTask = {
          send(options: SendSocketMessageOptions): void {
            socket.sendSocketMessage(options)
          },
          close(options: CloseSocketOptions): void {
            socket.closeSocket(options)
          },
          onOpen(callback: (result: OnSocketOpenCallbackResult) => void): void {
            socket.onSocketOpen(callback)
          },
          onClose(callback: (result: any) => void): void {
            socket.onSocketClose(callback)
          },
          onError(callback: (result: GeneralCallbackResult) => void): void {
            socket.onSocketError(callback)
          },
          onMessage(callback: (result: OnSocketMessageCallbackResult) => void): void {
            socket.onSocketMessage(callback)
          },
        }
        return socketTask
      }

      return undefined
    },

    sendSocketMessage(options: SendSocketMessageOptions): void {
      execWsGeneralFn(ws, (ws: WebSocket) => {
        ws.send(options.data)
      }, options)
    },

    onSocketMessage(callback: (result: OnSocketMessageCallbackResult) => void): void {
      setCallback('onSocketMessage', callback)
    },

    onSocketOpen(callback: (result: OnSocketOpenCallbackResult) => void): void {
      readyState = SocketState.OPEN
      setCallback('onSocketOpen', callback)
    },

    onSocketError(callback: (result: GeneralCallbackResult) => void): void {
      readyState = SocketState.CLOSING
      setCallback('onSocketError', callback)
    },

    onSocketClose(callback: (result: GeneralCallbackResult) => void): void {
      readyState = SocketState.CLOSED
      setCallback('onSocketClose', callback)
    },

    closeSocket(options: CloseSocketOptions): void {
      execWsGeneralFn(ws, (ws: WebSocket) => {
        ws.close(options.code, options.reason)
      }, options)
    },
  }

  Object.defineProperty(socket, 'readyState', {
    writable: false,
    enumerable: false,
    configurable: false,
    get(): any {
      return readyState
    },
    set(v: any) {
      DEV && console.warn('readyState is readonly')
    },
  })

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
