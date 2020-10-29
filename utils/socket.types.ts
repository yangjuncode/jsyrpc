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
  protocols?: string[]
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
   * 支付宝小程序下必须为string 需要发送的内容：普通的文本内容 String 或者经 Base64 编码后的 String。
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
  /**
   * 支付宝小程序专用
   * 如果发送二进制数据，需要将入参数据经 Base64 编码成 String 后赋值 data，同时将此字段设置为 true。
   * 如果是普通的文本内容 String，则不需要设置此字段。
   */
  isBuffer?: boolean
}

export interface OnSocketMessageCallbackResult {
  /**
   * 服务器返回的消息
   */
  data: string | ArrayBuffer
  /**
   * 支付宝专用，标记响应数据是否为ArrayBuffer
   */
  isBuffer?: boolean
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


export interface NetworkStatusChangeResult {
  isConnected: boolean
  // 值       说明          平台差异说明
  // wifi     wifi网络	
  // 2g       2g网络
  // 3g       3g网络
  // 4g       4g网络
  // ethernet 有线网络      App
  // unknown  Android下不常见的网络类型
  // none     无网络
  networkType: string
}

export interface NetworkStatusChangeCallback {
  (result: NetworkStatusChangeResult): void
}

export interface SocketTask {
  /**
   * 通过 WebSocket 连接发送数据
   */
  send (options: SendSocketMessageOptions): void

  /**
   * 关闭 WebSocket 连接
   */
  close (options?: CloseSocketOptions): void

  /**
   * 监听 WebSocket 连接打开事件
   */
  onOpen (callback: (result: OnSocketOpenCallbackResult) => void): void

  /**
   * 监听 WebSocket 连接关闭事件
   */
  onClose (callback: (result: any) => void): void

  /**
   * 监听 WebSocket 错误
   */
  onError (callback: (result: GeneralCallbackResult) => void): void

  /**
   * 监听WebSocket接受到服务器的消息事件
   */
  onMessage (callback: (result: OnSocketMessageCallbackResult) => void): void
}

export interface IRpcSocket {
  readyState?: number

  connectSocket (options: ConnectSocketOption): SocketTask | undefined

  sendSocketMessage (options: SendSocketMessageOptions): void

  onSocketMessage (callback: (result: OnSocketMessageCallbackResult) => void): void

  onSocketOpen (callback: (result: OnSocketOpenCallbackResult) => void): void

  onSocketError (callback: (result: GeneralCallbackResult) => void): void

  onSocketClose (callback: (result: GeneralCallbackResult) => void): void

  closeSocket (options: CloseSocketOptions): void

  closeSocketForce (options: CloseSocketOptions): void

  clearSocketEvent (): void

  onNetworkStatusChange (callback: NetworkStatusChangeCallback): void
  
  offNetworkStatusChange (callback?: NetworkStatusChangeCallback): void
}
