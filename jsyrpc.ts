import { yrpcmsg } from 'yrpcmsg'
import pako from 'pako'
import { IntPubSub, StrPubSub } from 'ypubsub'
import { Writer } from 'protobufjs'
import base64 from '@protobufjs/base64'
import { str2uint8array } from 'yrpcjsutil'
import { rpcSocket } from './utils/socket'
import { SocketState } from './utils/common'
import {
  GeneralCallbackResult,
  NetworkStatusChangeResult,
  OnSocketMessageCallbackResult,
  OnSocketOpenCallbackResult,
} from './utils/socket.types'
import 'core-js/features/global-this'
import dayjs from 'dayjs'
import IMeta = yrpcmsg.IMeta
import IGrpcMeta = yrpcmsg.IGrpcMeta
import GrpcMeta = yrpcmsg.GrpcMeta
import UnixTime = yrpcmsg.UnixTime

function isCallbackInMap(key: string, callBack: Function, _map: Map<string, Function[]>): boolean {
  let mapItem = _map.get(key)

  if (!mapItem) {
    return false
  }

  return mapItem.includes(callBack)
}

function addCallback2Map(key: string, callBack: Function, _map: Map<string, Function[]>) {
  let calbacks = _map.get(key)
  if (!calbacks) {
    calbacks = [callBack]
  } else {
    calbacks.push(callBack)
  }
  _map.set(key, calbacks)
}

function delCallbackFromMap(key: string, callBack: Function, _map: Map<string, Function[]>) {
  let calbacks = _map.get(key)
  if (!calbacks) {
    return
  }
  calbacks = calbacks.filter(
    function (v: any): boolean {
      return v !== callBack

    })
  _map.set(key, calbacks)
}

export interface IResult {
  (res: any, rpcCmd: yrpcmsg.Ymsg, meta?: IGrpcMeta): void
}

export interface IFinished {
  (rpcCmd: yrpcmsg.Ymsg): void
}

//remote
export interface IServerErr {
  (errRpc: yrpcmsg.Ymsg): void
}

export interface ILocalErr {
  (err: any): void
}

export interface IPong {
  (rpcCmd: yrpcmsg.Ymsg, unixTime: UnixTime): void
}

export interface ICancel {
  (rpcCmd: yrpcmsg.Ymsg): void
}

export interface IGrpcHeader {
  (rpcCmd: yrpcmsg.Ymsg): void
}

export class TrpcMeta {
  SetMeta(key: string, val: string) {
    this.meta[key] = [val]
  }

  SetMetas(key: string, val: string[]) {
    this.meta[key] = val
  }

  SetProtoMsg(key: string, msg: any) {
    let bin: Uint8Array = msg.constructor.encode(msg).finish()
    let b64 = base64.encode(bin, 0, bin.length)
    this.SetMeta(key, b64)
  }

  Encode(): IMeta {
    let metainfo = new yrpcmsg.Meta()
    for (const key in this.meta) {
      let item = new yrpcmsg.MetaItem(
        {
          key: key,
          vals: this.meta[key],
        },
      )
      metainfo.val.push(item)
    }

    return metainfo

  }

  private meta: { [key: string]: string[] } = {}

}

export interface ICallOption {
  //timeout in seconds
  timeout?: number
  //grpc meta, see yrpcmsg.metainfo
  rpcMeta?: TrpcMeta
  //when got reply for server,call this fn
  OnResult?: IResult
  //when got call err, call this fn
  OnServerErr?: IServerErr
  OnLocalErr?: ILocalErr
  //stream ping got pong response
  OnPong?: IPong
  //on call timeout
  OnTimeout?: Function
  //on call got cancel response from server
  OnCancel?: ICancel
  //when got grpc header
  OnGrpcHeader?: IGrpcHeader
  //when got stream finished response, call this fn
  OnStreamFinished?: IFinished
  //流式调用已经建立（收到了回应)
  OnStreamStarted?: Function
}

export class TRpcStream {
  callOpt: ICallOption = { timeout: 30 }
  api: string
  apiVerion: number
  cid: number
  reqType: any
  resType: any
  metaInfo?: IMeta

  //是否已经收到stream调用的回应
  StreamSetupOK = false

  //streamType 1:client 2:server 3:bidi
  streamType: number
  private newNo = 0
  LastSendTime: number = Date.now()
  LastRecvTime: number = Date.now()
  private intervalTmrId: number | NodeJS.Timeout = -1

  //streamType 3:client 7:server 8:bidi
  constructor(api: string, v: number, streamType: number, reqType: any, resType: any, callOpt?: ICallOption) {
    Object.assign(this.callOpt, callOpt)
    this.api = api
    this.apiVerion = v
    this.streamType = streamType
    this.reqType = reqType
    this.resType = resType
    this.metaInfo = this.callOpt.rpcMeta?.Encode()
    this.cid = rpcCon.NewCid()
    IntPubSub.subscribe(this.cid, this.onRpc.bind(this))

    if (!this.callOpt.timeout || this.callOpt.timeout <= 0) {
      this.callOpt.timeout = 30
    }

    this.intervalTmrId = globalThis.setInterval(() => {
      this.intervalCheck()
    }, 5000)
  }

  reqEncode(req: any): Uint8Array {
    let w: Writer = this.reqType.encode(req)
    return w.finish()
  }

  clearCall() {
    IntPubSub.unsubscribe(this.cid)
    if (this.intervalTmrId >= 0) {
      customClearInterval(this.intervalTmrId)
      this.intervalTmrId = -1
    }
  }

  sendFirst(req: any) {
    let reqData = this.reqEncode(req)
    let rpc = new yrpcmsg.Ymsg()
    rpc.Cmd = this.streamType
    rpc.Body = reqData
    rpc.Optstr = this.api
    rpc.Sid = rpcCon.Sid
    rpc.Cid = this.cid
    rpc.No = 0
    rpc.MetaInfo = this.metaInfo
    this.newNo = 1

    this.sendMsg(rpc)

  }

  //return rpc no,if <0: not send to socket
  //一般要在流式调用建立OK后才能继续发送
  sendNext(req: any): number {
    let reqData = this.reqEncode(req)
    let rpc = new yrpcmsg.Ymsg()
    rpc.Cmd = 5
    rpc.Body = reqData
    rpc.Sid = rpcCon.Sid
    rpc.Cid = this.cid
    rpc.No = this.newNo
    ++this.newNo

    if (!this.sendMsg(rpc)) {
      return -1
    }

    return rpc.No
  }

  //client stream finish
  sendFinish() {
    let rpc = new yrpcmsg.Ymsg()
    rpc.Cmd = 6
    rpc.Sid = rpcCon.Sid
    rpc.Cid = this.cid
    this.sendMsg(rpc)
  }

  //cancel the rpc call
  cancel() {
    let rpc = new yrpcmsg.Ymsg()
    rpc.Cmd = 4
    rpc.Sid = rpcCon.Sid
    rpc.Cid = this.cid
    this.sendMsg(rpc)
  }

  sendMsg(msg: yrpcmsg.Ymsg): boolean {
    let ok = rpcCon.sendRpc(msg)
    if (ok) {
      this.LastSendTime = Date.now()
    }
    return ok
  }

  //stream ping to keep stream call alive in yrpc-proxy
  streamPing() {
    let rpc = new yrpcmsg.Ymsg()
    rpc.Cmd = 14
    rpc.Cid = this.cid

    this.sendMsg(rpc)
  }

  onRpc(rpc: yrpcmsg.Ymsg) {
    this.LastRecvTime = rpcCon.LastRecvTime
    let res: any = null
    switch (rpc.Cmd) {
      case 2:
        this.callOpt.OnGrpcHeader?.(rpc)
        break
      case 3:
        //client stream call send first ok
        this.StreamSetupOK = true
        this.callOpt.OnStreamStarted?.()
        break
      case 4:
        //stream call got err
        this.clearCall()
        this.callOpt.OnServerErr?.(rpc)
        break
      case 5:
        //got client stream send response
        //fixme clear cache
        break
      case 6:
        //stream finished send got recveived by server
        break
      case 7:
        //server stream call send first ok
        this.StreamSetupOK = true
        this.callOpt.OnStreamStarted?.()
        break
      case 8:
        //bidi stream call send first ok
        this.StreamSetupOK = true
        this.callOpt.OnStreamStarted?.()
        break
      case 12:
        //got reply from server
        if (rpc.Body.length > 0) {
          res = this.resType.decode(rpc.Body)
        } else {
          res = new this.resType
        }
        this.callOpt.OnResult?.(res, rpc)
        break
      case 13:
        //stream call finished
        this.clearCall()
        this.callOpt.OnStreamFinished?.(rpc)
        break
      case 44:
        //got cancel stream call response
        this.clearCall()
        this.callOpt.OnCancel?.(rpc)
        break
    }
  }

  intervalCheck() {
    //this.callOpt.timeout second time out
    const _timeout = this.callOpt.timeout as number * 1000
    const nowTime = Date.now()

    if (nowTime - this.LastRecvTime > _timeout && nowTime - this.LastSendTime > _timeout) {
      this.cancel()
      this.clearCall()

      const nowTimeFmt = dayjs(nowTime).format('YYYY-MM-DD HH:mm:ss')
      const lastRecvTimeFmt = dayjs(this.LastRecvTime).format('YYYY-MM-DD HH:mm:ss')
      const lastSendTimeFmt = dayjs(this.LastSendTime).format('YYYY-MM-DD HH:mm:ss')

      this.callOpt.OnTimeout?.(
        'rpc timeout:' + this.api + ',nowTime:' + nowTimeFmt + ',LastSendTime:' + lastSendTimeFmt + ',LastRecvTime:',
        lastRecvTimeFmt,
      )
    }
  }
}

export interface IrpcCon {
  readonly wsUrl: string

  initWsCon(url: string): void

  isWsConnected(): boolean

  ping(pongFn?: IPong): void

  sendRpcData(rpcData: Uint8Array): boolean

  sendRpc(rpc: yrpcmsg.Ymsg): boolean

  NocareCall(reqData: Uint8Array, api: string, v: number, callOpt?: ICallOption): boolean

  UnaryCall(reqData: Uint8Array, api: string, v: number, resType: any, callOpt?: ICallOption): boolean

  on(event: string, cb: Function): void

  off(event?: string | string[], cb?: Function): void

  NatsSubscribeAgain(): void
}

function customClearInterval(handle?: number | undefined | NodeJS.Timeout): void {
  // @ts-ignore
  globalThis.clearInterval(handle)
}

function customClearTimeout(handle?: number | undefined | NodeJS.Timeout): void {
  // @ts-ignore
  globalThis.clearTimeout(handle)
}

enum SocketCloseCode {
  Unknown = 4000,
  PingTimeout,
  Offline,
}

export class TrpcCon implements IrpcCon {
  Sid: Uint8Array = new Uint8Array()
  wsUrl = ''
  LastRecvTime = -1
  LastSendTime = -1
  private cid = 1

  OnceSubscribeList: Map<string, Function[]> = new Map<string, Function[]>()
  SubscribeList: Map<string, Function[]> = new Map<string, Function[]>()

  // 5分钟内ping一次服务器，以保持连接有效
  private pingId: number | NodeJS.Timeout | undefined = undefined
  // 超时时间单位为ms
  private pingCheckTimeout: number = 3 * 60 * 1000
  private pingMaxTimeout: number = 5 * 60 * 1000
  private lastPingCheckTime = 0

  on(event: string, cb: Function): void {
    StrPubSub.subscribe(event, cb)
  }

  off(event?: string | string[], cb?: Function): void {
    StrPubSub.unsubscribe(event, cb)
  }

  initWsCon(url: string) {
    this.wsUrl = url

    // 每次连接，都清除之前的socket生命周期事件的订阅
    rpcSocket.clearSocketEvent()

    rpcSocket.onSocketError((result) => {
      this.onWsErr(result)
    })
    rpcSocket.onSocketClose((result) => {
      this.onWsClose(result)
    })
    rpcSocket.onSocketOpen((result) => {
      this.onWsOpen(result)
    })
    rpcSocket.onSocketMessage((result) => {
      this.onWsMsg(result)
    })

    rpcSocket.onNetworkStatusChange(this._onNetworkStatusChange)

    rpcSocket.connectSocket({
      url,
    })
  }

  _online() {
    // 网络重新连接后，将重连定时器重置5s，并重新连接
    this._connectTimeout = 5000
    this.initWsCon(this.wsUrl)
  }

  _offline() {
    // 网络断开，强制关闭socket连接
    this._isCloseForce = true
    rpcSocket.closeSocketForce({
      code: SocketCloseCode.Offline,
      reason: 'offline',
    })
  }

  _onNetworkStatusChange(res: NetworkStatusChangeResult) {
    if (res.isConnected) {
      // online
      this._online()
    } else {
      // offline
      this._offline()
    }
  }

  isWsConnected(): boolean {
    return rpcSocket.readyState === SocketState.OPEN
  }

  pingCheck() {
    const nowTime = Date.now()
    this.lastPingCheckTime = nowTime
    const notSendTime = nowTime - this.LastSendTime

    if (notSendTime >= this.pingMaxTimeout) {
      this.ping()
      return
    }

    const timeoutTime = this.LastSendTime + this.pingMaxTimeout - nowTime

    if (timeoutTime > this.pingCheckTimeout) {
      //下一次pingcheck继续检查

      return
    } else {
      const nextCheckTime = nowTime + this.pingCheckTimeout

      setTimeout(() => {
        if (this.LastSendTime + this.pingCheckTimeout > nextCheckTime) {
          //下一次Pingcheck处理
          return
        }
        this.ping()
      }, timeoutTime)
    }
  }

  autoPing() {
    // 先ping一次服务器
    this.ping()

    // 启动定时器
    this.pingId = globalThis.setInterval(this.pingCheck.bind(this), this.pingCheckTimeout)
  }

  sendRpcData(rpcData: Uint8Array): boolean {
    if (!this.isWsConnected()) {
      return false
    }

    rpcSocket.sendSocketMessage({ data: rpcData })
    this.LastSendTime = Date.now()

    return true
  }

  sendRpc(rpc: yrpcmsg.Ymsg): boolean {
    let w = yrpcmsg.Ymsg.encode(rpc)
    let rpcData = w.finish()
    return this.sendRpcData(rpcData)
  }

  onWsMsg(ev: MessageEvent | OnSocketMessageCallbackResult): void {
    this.LastRecvTime = Date.now()
    let rpcData = new Uint8Array(ev.data)
    let rpcMsg = yrpcmsg.Ymsg.decode(rpcData)

    if (rpcMsg.Body.length > 0) {
      let zipType = rpcMsg.Cmd & 0x000f0000
      switch (zipType) {
        case 0x00010000://lz4
          throw new Error('no lz4 support now')
        case 0x00020000://zlib
          rpcMsg.Body = pako.inflate(rpcMsg.Body)
          break
      }

    }
    if (rpcMsg.Optbin.length > 0) {
      let zipType = rpcMsg.Cmd & 0x00f00000
      switch (zipType) {
        case 0x00100000://lz4
          throw new Error('no lz4 support now')
        case 0x00200000://zlib
          rpcMsg.Optbin = pako.inflate(rpcMsg.Optbin)
          break
      }
    }

    rpcMsg.Cmd = rpcMsg.Cmd & 0xffff
    switch (rpcMsg.Cmd) {
      case 1:
        //unary call response
        IntPubSub.publish(rpcMsg.Cid, rpcMsg)
        break
      case 2:
        //grpc header
        IntPubSub.publish(rpcMsg.Cid, rpcMsg)
        break
      case 3:
        //client stream call setup respone
        IntPubSub.publish(rpcMsg.Cid, rpcMsg)
        break
      case 4:
        //server err
        IntPubSub.publish(rpcMsg.Cid, rpcMsg)
        break
      case 5:
        //send next response
        IntPubSub.publish(rpcMsg.Cid, rpcMsg)
        break
      case 6:
        //send close response
        IntPubSub.publish(rpcMsg.Cid, rpcMsg)
        break
      case 7:
        //server stream call setup response
        IntPubSub.publish(rpcMsg.Cid, rpcMsg)
        break
      case 8:
        //bidi stream call setup response
        IntPubSub.publish(rpcMsg.Cid, rpcMsg)
        break
      case 9:
        //nats publish response
        IntPubSub.publish(rpcMsg.Cid, rpcMsg)
        break
      case 10:
        //nats sub/unsub response
        IntPubSub.publish(rpcMsg.Cid, rpcMsg)
        break
      case 11:
        //got nats msg
        this.onNatsMsg(rpcMsg)
        break

      case 12:
        //got server stream reply
        this.recvConfirm(rpcMsg)
        IntPubSub.publish(rpcMsg.Cid, rpcMsg)
        break

      case 13:
        //server stream finished
        this.recvConfirm(rpcMsg)
        IntPubSub.publish(rpcMsg.Cid, rpcMsg)
        break
      case 14:
        if (rpcMsg.Res == 1) {
          //ping response
          IntPubSub.publish(rpcMsg.Cid, rpcMsg)
        } else {
          //respone server ping
          this.onping(rpcMsg)
        }
        break
      case 44:

        break

    }

  }

  onNatsMsg(rpc: yrpcmsg.Ymsg) {
    let onceSubsFn = this.OnceSubscribeList.get(rpc.Optstr) || []
    if (onceSubsFn.length > 0) {
      this.OnceSubscribeList.delete(rpc.Optstr)

      for (let j = 0; j < onceSubsFn.length; ++j) {
        onceSubsFn[j].apply(this, [rpc])
      }
    }

    let subsFn = this.SubscribeList.get(rpc.Optstr) || []
    if (subsFn.length === 0) {
      //没有订阅了，从服务器中删除订阅
      this.NatsUnsubsribe(rpc.Optstr)
    } else {
      for (let i = 0; i < subsFn.length; ++i) {
        subsFn[i].apply(this, [rpc])
      }
    }
  }

  onWsErr(ev: Event | GeneralCallbackResult): void {
    console.error('ws err:', ev)
  }

  // 默认5000重连webSocket
  _connectTimeout = 5000

  _getSocketConnectTimeout(): number {
    // 重连间隔最大为5分钟
    const maxTime = 5 * 60 * 1000
    if (this._connectTimeout >= maxTime) {
      this._connectTimeout = maxTime
    } else {
      this._connectTimeout += 1000
    }

    return this._connectTimeout
  }

  onWsClose(ev: CloseEvent | GeneralCallbackResult): void {
    console.log('ws closed:', ev)
    StrPubSub.publish('onclose', ev)

    customClearTimeout(this.pingId)
    rpcSocket.offNetworkStatusChange()

    globalThis.setTimeout(() => {
      if (this.isWsConnected()) {
        return
      }
      this.initWsCon(this.wsUrl)
    }, this._getSocketConnectTimeout())
  }

  onWsOpen(ev: Event | OnSocketOpenCallbackResult) {
    console.log('ws open:', ev)
    StrPubSub.publish('onopen', ev)
    this.autoPing()
    this._connectTimeout = 5000
    this._isCloseForce = false
  }

  _NatsSubscribeAgain(subscribeList: Map<string, Function[]>) {
    const SubscribeList = subscribeList.entries()
    for (let [subject, callbackList] of SubscribeList) {
      callbackList.forEach(() => {
        const rpc = new yrpcmsg.Ymsg()
        rpc.Cmd = 10
        rpc.Res = 1
        rpc.Cid = this.NewCid()
        rpc.Optstr = subject
        this.sendRpc(rpc)
      })
    }
  }

  NatsSubscribeAgain() {
    this._NatsSubscribeAgain(this.SubscribeList)
    this._NatsSubscribeAgain(this.OnceSubscribeList)
  }

  //return cid in rpccmd, <0: not send
  NatsPublish(subject: string, data: Uint8Array, reply?: string): number {
    if (!this.isWsConnected()) {
      return -1
    }

    let rpc = new yrpcmsg.Ymsg()
    rpc.Cmd = 9
    rpc.Cid = this.NewCid()
    rpc.Optstr = subject
    rpc.Body = data

    if (reply) {
      rpc.Optbin = str2uint8array(reply)
    }
    this.sendRpc(rpc)
    return rpc.Cid
  }

  NatsSubsribe(subject: string, FnMsg: Function): boolean {
    if (!this.isWsConnected()) {
      return false
    }
    let hasExist = isCallbackInMap(subject, FnMsg, this.SubscribeList)
    if (hasExist) {
      return true
    }
    let rpc = new yrpcmsg.Ymsg()
    rpc.Cmd = 10
    rpc.Res = 1
    rpc.Cid = this.NewCid()
    rpc.Optstr = subject

    addCallback2Map(subject, FnMsg, this.SubscribeList)

    return this.sendRpc(rpc)

  }

  NatsSubsribeOnce(subject: string, FnMsg: Function) {
    if (!this.isWsConnected()) {
      return false
    }
    let hasExist = isCallbackInMap(subject, FnMsg, this.OnceSubscribeList)
    if (hasExist) {
      return true
    }
    let rpc = new yrpcmsg.Ymsg()
    rpc.Cmd = 10
    rpc.Res = 1
    rpc.Cid = this.NewCid()
    rpc.Optstr = subject

    addCallback2Map(subject, FnMsg, this.OnceSubscribeList)

    return this.sendRpc(rpc)
  }

  NatsUnsubsribe(subject: string, FnMsg?: Function) {
    let rpc = new yrpcmsg.Ymsg()
    rpc.Cmd = 10
    rpc.Res = 2
    rpc.Cid = this.NewCid()
    rpc.Optstr = subject
    this.sendRpc(rpc)

    if (!FnMsg) {
      this.OnceSubscribeList.delete(subject)
      this.SubscribeList.delete(subject)
    } else {
      delCallbackFromMap(subject, FnMsg, this.OnceSubscribeList)
      delCallbackFromMap(subject, FnMsg, this.SubscribeList)
    }

  }

  NewCid(): number {
    let newCid = this.genCid()
    while (IntPubSub.hasSubscribe(newCid)) {
      newCid = this.genCid()
    }

    return newCid
  }

  private genCid(): number {
    if (this.cid === 0xFFFFFFFF) {
      this.cid = 1
      return 0xFFFFFFFF
    }

    return this.cid++
  }

  recvConfirm(msg: yrpcmsg.Ymsg) {
    let resMsg = new yrpcmsg.Ymsg()
    resMsg.Cid = msg.Cid
    resMsg.No = msg.No
    resMsg.Cmd = msg.Cmd

    this.sendRpc(resMsg)
  }

  _isCloseForce = false

  ping(pongFn?: IPong): void {
    let rpc = new yrpcmsg.Ymsg()
    rpc.Cmd = 14
    rpc.Cid = rpcCon.NewCid()
    if (pongFn) {
      rpc.Optstr = '1'
    }
    let timeoutId: number | NodeJS.Timeout = globalThis.setTimeout(() => {
      IntPubSub.unsubscribe(rpc.Cid)
      // ping不通，表示连接有问题，主动关闭webSocket
      if (!this._isCloseForce) {
        this._isCloseForce = true
        rpcSocket.closeSocketForce({
          code: SocketCloseCode.PingTimeout,
          reason: 'ping timeout',
        })
      }
    }, 5 * 1000)

    const subscribePingRes = (resRpc: yrpcmsg.Ymsg) => {
      customClearTimeout(timeoutId)
      if (pongFn) {
        let unixTime = UnixTime.decode(resRpc.Body)
        pongFn(resRpc, unixTime)
      }
    }

    IntPubSub.subscribeOnce(rpc.Cid, subscribePingRes.bind(this))
    this.sendRpc(rpc)
  }

  onping(rpc: yrpcmsg.Ymsg) {
    rpc.Res = 1
    this.sendRpc(rpc)
  }

  NocareCall(reqData: Uint8Array, api: string, v: number, callOpt?: ICallOption): boolean {
    let rpc = new yrpcmsg.Ymsg()
    rpc.Cmd = 2
    rpc.Body = reqData
    rpc.Optstr = api
    rpc.MetaInfo = callOpt?.rpcMeta?.Encode()

    return this.sendRpc(rpc)
  }

  UnaryCall(reqData: Uint8Array, api: string, v: number, resType: any, callOpt?: ICallOption): boolean {
    let rpc = new yrpcmsg.Ymsg()

    rpc.Cmd = 1
    rpc.Sid = rpcCon.Sid
    rpc.Cid = rpcCon.NewCid()
    rpc.Body = reqData
    rpc.Optstr = api
    rpc.MetaInfo = callOpt?.rpcMeta?.Encode()

    let sendOk = this.sendRpc(rpc)

    if (!callOpt) {
      return sendOk
    }

    if (!sendOk) {
      callOpt?.OnLocalErr?.('can not send to socket')
      return sendOk
    }
    if (!callOpt.timeout || callOpt.timeout <= 0) {
      callOpt.timeout = 30
    }
    let timeoutId: number | NodeJS.Timeout = globalThis.setTimeout(() => {
      IntPubSub.unsubscribe(rpc.Cid)
      callOpt?.OnTimeout?.('rpc timeout:' + api)
    }, callOpt.timeout * 1000)

    const subscribeCb = (resRpc: yrpcmsg.Ymsg) => {
      switch (resRpc.Cmd) {
        case 1:
          let res = resType.decode(resRpc.Body)
          if (resRpc.Optbin.length > 0) {
            let grpcmeta = GrpcMeta.decode(resRpc.Optbin)
            callOpt?.OnResult?.(res, resRpc, grpcmeta)
          } else {
            callOpt?.OnResult?.(res, resRpc)
          }

          break
        case 4:
          callOpt?.OnServerErr?.(resRpc)
          break
        default:
          console.log('unary call bad:res:', rpc, resRpc)
      }
      customClearTimeout(timeoutId)
    }
    IntPubSub.subscribeOnce(rpc.Cid, subscribeCb.bind(this))

    return sendOk

  }

}

export let rpcCon = new TrpcCon()
