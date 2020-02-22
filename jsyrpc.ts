import {yrpcmsg} from 'yrpcmsg'

import pako from 'pako'
import ypubsub from 'ypubsub';
import IMeta = yrpcmsg.IMeta;
import IGrpcMeta = yrpcmsg.IGrpcMeta;
import Meta = yrpcmsg.Meta;
import GrpcMeta = yrpcmsg.GrpcMeta;
import UnixTime = yrpcmsg.UnixTime;
import {Writer} from 'protobufjs';

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

export class TCallOption {
  //timeout in seconds
  timeout: number = 30
  rpcMeta?: IMeta
  OnResult?: IResult
  OnServerErr?: IServerErr
  OnLocalErr?: ILocalErr
  OnPong?: IPong
  OnTimeout?: Function
  OnCancel?: ICancel
  OnStreamFinished?: IFinished

}

export class TRpcStream {
  callOpt: TCallOption
  api: string
  apiVerion: number
  cid: number
  reqType: any
  resType: any
  metaInfo?: IMeta

  //streamType 1:client 2:server 3:bidi
  streamType: number
  private newNo: number = 0
  LastSendTime: number = Date.now()
  LastRecvTime: number = Date.now()
  private intervalTmrId: number = -1

  //streamType 3:client 7:server 8:bidi
  constructor(api: string, v: number, streamType: number, reqType: any, resType: any, callOpt?: TCallOption) {
    this.api = api
    this.apiVerion = v
    this.streamType = streamType
    this.reqType = reqType
    this.resType = resType
    this.metaInfo = callOpt?.rpcMeta
    this.cid = rpcCon.NewCid()
    ypubsub.subscribeInt(this.cid, this.onRpc)

    if (!callOpt) {
      callOpt = new TCallOption()
      callOpt.timeout = 30
    }
    if (callOpt.timeout <= 0) {
      callOpt.timeout = 30
    }
    this.callOpt = callOpt

    setInterval(() => {
      this.intervalCheck()
    }, 5000)
  }

  reqEncode(req: any): Uint8Array {
    let w: Writer = this.reqType.encode(req), reqData = w.finish();
    return reqData
  }

  clearCall() {
    ypubsub.unsubscribeInt(this.cid)
    if (this.intervalTmrId >= 0) {
      clearInterval(this.intervalTmrId)
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

    let sendOk = rpcCon.sendRpc(rpc)
    if (sendOk) {
      this.LastSendTime = Date.now()
    }

  }

  //return rpc no,if <0: not send to socket
  sendNext(req: any): number {
    let reqData = this.reqEncode(req)
    let rpc = new yrpcmsg.Ymsg()
    rpc.Cmd = 5
    rpc.Body = reqData
    rpc.Sid = rpcCon.Sid
    rpc.Cid = this.cid
    rpc.No = this.newNo
    ++this.newNo

    if (!rpcCon.sendRpc(rpc)) {
      return -1
    } else {
      this.LastSendTime = Date.now()
    }
    return rpc.No
  }

  //client stream finish
  sendFinish() {
    let rpc = new yrpcmsg.Ymsg()
    rpc.Cmd = 6
    rpc.Sid = rpcCon.Sid
    rpc.Cid = this.cid
    let sendOk = rpcCon.sendRpc(rpc)
    if (sendOk) {
      this.LastSendTime = Date.now()
    }
  }

  //cancel the rpc call
  cancel() {
    let rpc = new yrpcmsg.Ymsg()
    rpc.Cmd = 4
    rpc.Sid = rpcCon.Sid
    rpc.Cid = this.cid
    let sendOk = rpcCon.sendRpc(rpc)
    if (sendOk) {
      this.LastSendTime = Date.now()
    }

  }

  //stream ping
  streamPing() {
    let rpc = new yrpcmsg.Ymsg()
    rpc.Cmd = 14
    rpc.Sid = rpcCon.Sid
    rpc.Cid = rpcCon.NewCid()

    let sendOk = rpcCon.sendRpc(rpc)
    if (sendOk) {
      this.LastSendTime = Date.now()
    }
  }

  onRpc(rpc: yrpcmsg.Ymsg) {
    this.LastRecvTime = rpcCon.LastRecvTime
    let res: any = null
    switch (rpc.Cmd) {
      case 3:
        //client stream call send first ok
        break
      case 4:
        //stream call got err
        this.clearCall()
        this.callOpt.OnServerErr?.(rpc)
        break
      case 5:
        //got client stream send response
        break
      case 7:
        //server stream call send first ok
        break
      case 8:
        //bidi stream call send first ok
        break
      case 12:
        //got reply from server
        if (rpc.Body.length > 0) {
          res = this.resType.decode(rpc.Body)

        }
        if (this.callOpt.OnResult) {
          this.callOpt.OnResult(res, rpc)
        }
        break
      case 13:
        //stream call finished
        break
    }
  }

  intervalCheck() {
    let nowTime = Date.now()
    //todo intervalCheck
  }

}

export class TrpcCon {
  Sid: Uint8Array = new Uint8Array()
  wsUrl: string = ""
  wsCon: WebSocket | null = null
  LastRecvTime: number = -1
  LastSendTime: number = -1
  private cid: number = 0

  OnceSubscribeList: Map<string, Function[]> = new Map<string, Function[]>()
  SubscribeList: Map<string, Function[]> = new Map<string, Function[]>()


  initWsCon(url: string) {

    if (this.wsCon) {
      this.wsCon.close()
    }

    this.wsCon = new WebSocket(url)
    this.wsCon.binaryType = 'arraybuffer'
    this.wsUrl = url

    this.wsCon.onmessage = this.onWsMsg.bind(this)
    this.wsCon.onclose = this.onWsClose.bind(this)
    this.wsCon.onerror = this.onWsErr.bind(this)
    this.wsCon.onopen = this.onWsOpen.bind(this)

  }


  isWsConnected(): boolean {
    if (!this.wsCon) {
      return false
    }
    return this.wsCon.readyState === WebSocket.OPEN
  }

  sendRpcData(rpcData: Uint8Array): boolean {
    if (!this.wsCon) {
      return false
    }
    if (this.wsCon.readyState !== WebSocket.OPEN) {
      return false
    }

    this.wsCon.send(rpcData)
    this.LastSendTime = Date.now()
    return true
  }

  sendRpc(rpc: yrpcmsg.Ymsg): boolean {
    let w = yrpcmsg.Ymsg.encode(rpc)
    let rpcData = w.finish()
    return this.sendRpcData(rpcData)
  }

  onWsMsg(ev: MessageEvent): void {
    this.LastRecvTime = Date.now()
    let rpcData = new Uint8Array(ev.data)
    let rpc = yrpcmsg.Ymsg.decode(rpcData)

    if (rpc.Body.length > 0) {
      let zipType = rpc.Cmd & 0x000f0000
      switch (zipType) {
        case 0x00010000://lz4
          throw new Error("no lz4 support now")
        case 0x00020000://zlib
          rpc.Body = pako.inflate(rpc.Body)
          break
      }

    }
    if (rpc.Optbin.length > 0) {
      let zipType = rpc.Cmd & 0x00f00000
      switch (zipType) {
        case 0x00100000://lz4
          throw new Error("no lz4 support now")
        case 0x00200000://zlib
          rpc.Optbin = pako.inflate(rpc.Optbin)
          break
      }
    }

    rpc.Cmd = rpc.Cmd & 0xffff
    switch (rpc.Cmd) {
      case 1:
        //unary call response
        ypubsub.publishInt(rpc.Cid, rpc)
        break
      case 3:
        //client stream call setup respone
        ypubsub.publishInt(rpc.Cid, rpc)
        break
      case 4:
        //server err
        ypubsub.publishInt(rpc.Cid, rpc)
        break
      case 5:
        //send next response
        ypubsub.publishInt(rpc.Cid, rpc)
        break
      case 6:
        //send close response
        ypubsub.publishInt(rpc.Cid, rpc)
        break
      case 7:
        //server stream call response
        ypubsub.publishInt(rpc.Cid, rpc)
        break
      case 8:
        //bidi stream call setup response
        ypubsub.publishInt(rpc.Cid, rpc)
        break
      case 9:
        //nats publish response
        //fixme nats publish response
        break
      case 10:
        //nats sub/unsub response
        //fixme sub/unsub response
        break
      case 11:
        //got nats msg
        //fixme got nats msg
        break

      case 12:
        //got server stream reply
        //fixme server stream reply
        break

      case 13:
        //server stream finished
        //fixme server stream finished
        break
      case 14:
        if (rpc.Res == 1) {
          //ping response
          ypubsub.publishInt(rpc.Cid, rpc)
        } else {
          //respone server ping
          this.onping(rpc)
        }

    }

  }

  onWsErr(ev: Event): void {
    console.log("ws err:", ev);
  }

  onWsClose(ev: CloseEvent): void {
    this.wsCon = null
    console.log("ws closed:", ev)

    window.setTimeout(() => {
      if (this.isWsConnected()) {
        return
      }
      this.initWsCon(this.wsUrl)
    }, 3000)
  }

  onWsOpen(ev: Event) {
    console.log("ws open:", ev);
    this.ping()
  }


  //return cid in rpccmd, <0: not send
  NatsPublish(subject: string, data: Uint8Array, natsOpt?: yrpcmsg.NatsOption): number {
    if (!this.isWsConnected()) {
      return -1
    }

    let rpc = new yrpcmsg.Ymsg()
    rpc.Cmd = 11
    rpc.Cid = this.NewCid()
    rpc.Optstr = subject
    rpc.Body = data

    if (natsOpt) {
      let w = yrpcmsg.NatsOption.encode(natsOpt)
      rpc.Optbin = w.finish()
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
    rpc.Cmd = 12
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
    rpc.Cmd = 12
    rpc.Res = 1
    rpc.Cid = this.NewCid()
    rpc.Optstr = subject

    addCallback2Map(subject, FnMsg, this.OnceSubscribeList)

    return this.sendRpc(rpc)
  }

  NatsUnsubsribe(subject: string, FnMsg?: Function) {
    let rpc = new yrpcmsg.Ymsg()
    rpc.Cmd = 12
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

    while (true) {
      let newCid = this.genCid()
      if (ypubsub.hasSubscribeInt(newCid)) {
        continue
      }
      return newCid
    }


  }

  private genCid(): number {
    if (this.cid === 0xFFFFFFFF) {
      this.cid = 0
      return 0xFFFFFFFF
    }


    return this.cid++
  }

  ping(pongFn?: IPong): void {
    let rpc = new yrpcmsg.Ymsg()
    rpc.Cmd = 14
    rpc.Cid = rpcCon.NewCid()
    if (pongFn) {
      rpc.Optstr = "1"
    }
    let timeoutId: number = window.setTimeout(() => {
      ypubsub.unsubscribeInt(rpc.Cid)
    }, 5000)
    ypubsub.subscribeOnceInt(rpc.Cid, function (resRpc: yrpcmsg.Ymsg) {
      clearTimeout(timeoutId)
      if (pongFn) {
        let unixTime = UnixTime.decode(resRpc.Body)
        pongFn(resRpc, unixTime)
      }

    })
    this.sendRpc(rpc)

  }

  onping(rpc: yrpcmsg.Ymsg) {
    rpc.Res = 1
    this.sendRpc(rpc)
  }

  NocareCall(reqData: Uint8Array, api: string, v: number, callOpt?: TCallOption): boolean {
    let rpc = new yrpcmsg.Ymsg()
    rpc.Cmd = 2
    rpc.Body = reqData
    rpc.Optstr = api
    rpc.MetaInfo = callOpt?.rpcMeta

    return this.sendRpc(rpc)
  }

  UnaryCall(reqData: Uint8Array, api: string, v: number, resType: any, callOpt?: TCallOption): boolean {
    let rpc = new yrpcmsg.Ymsg()

    rpc.Cmd = 1
    rpc.Sid = rpcCon.Sid
    rpc.Cid = rpcCon.NewCid()
    rpc.Body = reqData
    rpc.Optstr = api
    rpc.MetaInfo = callOpt?.rpcMeta

    let sendOk = this.sendRpc(rpc)

    if (!callOpt) {
      return sendOk
    }

    if (!sendOk) {
      callOpt?.OnLocalErr?.("can not send to socket")
      return sendOk
    }
    if (callOpt.timeout <= 0) {
      callOpt.timeout = 30
    }
    let timeoutId: number = window.setTimeout(() => {
      ypubsub.unsubscribeInt(rpc.Cid)
      callOpt?.OnTimeout?.()
    }, callOpt.timeout * 1000)


    ypubsub.subscribeOnceInt(rpc.Cid, function (resRpc: yrpcmsg.Ymsg) {
      switch (resRpc.Cmd) {
        case 1:
          let res = resType.decode(resRpc.Body)
          if (resRpc.Optbin.length > 0) {
            let grpcmeta = GrpcMeta.decode(resRpc.Optbin)
            callOpt?.OnResult?.(res, resRpc, grpcmeta)
          } else {
            callOpt?.OnResult?.(res, resRpc)
          }

          break;
        case 4:
          callOpt?.OnServerErr?.(resRpc)
          break
        default:
          console.log("unary call bad:res:", resRpc);
      }
      clearTimeout(timeoutId)
    })

    return sendOk

  }

}

export let rpcCon = new TrpcCon()
