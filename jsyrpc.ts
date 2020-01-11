import {yrpc} from 'yrpcmsg'

import pako from 'pako'
import ypubsub from 'ypubsub';

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
  (res: any, rpcCmd: yrpc.Ymsg): void
}

//remote
export interface IServerErr {
  (errRpc: yrpc.Ymsg): void
}

export interface ILocalErr {
  (err: any): void
}

export interface IPong {
  (rpcCmd: yrpc.Ymsg): void
}

export interface ICancel {
  (rpcCmd: yrpc.Ymsg): void
}

export class TCallOption {
  //timeout in seconds
  timeout: number = 30
  OnResult?: IResult
  OnServerErr?: IServerErr
  OnLocalErr?: ILocalErr
  OnPong?: IPong
  OnTimeout?: Function
  OnCancel?: ICancel

}

export class TRpcStream {
  callOpt: TCallOption
  api: string
  apiVerion: number
  cid: number
  resType: any
  private newNo: number = 0
  LastSendTime: number = Date.now()
  LastRecvTime: number = Date.now()
  private intervalTmrId: number = -1

  constructor(api: string, v: number, resType: any, callOpt?: TCallOption) {
    this.api = api
    this.apiVerion = v
    this.resType = resType
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

  clearCall() {
    ypubsub.unsubscribeInt(this.cid)
    if (this.intervalTmrId >= 0) {
      clearInterval(this.intervalTmrId)
      this.intervalTmrId = -1
    }
  }


  sendFirst(reqData: Uint8Array) {
    let rpc = new yrpc.Ymsg()
    if (this.apiVerion > 0) {
      rpc.cmd = 1 | (this.apiVerion << 24)

    } else {
      rpc.cmd = 1
    }
    rpc.body = reqData
    rpc.optstr = this.api
    rpc.sid = rpcCon.Sid
    rpc.cid = this.cid
    rpc.no = 0
    this.newNo = 1

    let sendOk = rpcCon.sendRpc(rpc)
    if (sendOk) {
      this.LastSendTime = Date.now()
    }

  }

  //return rpc no,if <0: not send to socket
  sendNext(reqData: Uint8Array): number {
    let rpc = new yrpc.Ymsg()
    if (this.apiVerion > 0) {
      rpc.cmd = 7 | (this.apiVerion << 24)

    } else {
      rpc.cmd = 7
    }
    rpc.body = reqData
    rpc.sid = rpcCon.Sid
    rpc.cid = this.cid
    rpc.no = this.newNo
    ++this.newNo

    if (!rpcCon.sendRpc(rpc)) {
      return -1
    } else {
      this.LastSendTime = Date.now()
    }
    return rpc.no
  }

  //client stream finish
  sendFinish() {
    let rpc = new yrpc.Ymsg()
    rpc.cmd = 9
    rpc.sid = rpcCon.Sid
    rpc.cid = this.cid
    let sendOk = rpcCon.sendRpc(rpc)
    if (sendOk) {
      this.LastSendTime = Date.now()
    }
  }

  //cancel the rpc call
  cancel() {
    let rpc = new yrpc.Ymsg()
    rpc.cmd = 44
    rpc.sid = rpcCon.Sid
    rpc.cid = this.cid
    let sendOk = rpcCon.sendRpc(rpc)
    if (sendOk) {
      this.LastSendTime = Date.now()
    }

  }

  //ping
  ping() {
    let rpc = new yrpc.Ymsg()
    rpc.cmd = 3
    rpc.sid = rpcCon.Sid
    rpc.cid = rpcCon.NewCid()

    let sendOk = rpcCon.sendRpc(rpc)
    if (sendOk) {
      this.LastSendTime = Date.now()
    }
  }

  onRpc(rpc: yrpc.Ymsg) {
    this.LastRecvTime = rpcCon.LastRecvTime
    let res: any = null
    switch (rpc.cmd) {
      case 2:
        this.clearCall()
        if (rpc.body.length > 0) {
          res = this.resType.decode(rpc.body)

        }
        if (this.callOpt.OnResult) {
          this.callOpt.OnResult(res, rpc)
        }
        break
      case 3:
        if (this.callOpt.OnPong) {
          this.callOpt.OnPong(rpc)
        }
        break
      case 4:
        this.clearCall()
        if (rpc.res === 44) {
          if (this.callOpt.OnCancel) {
            this.callOpt.OnCancel(rpc)
            break
          }
        }
        if (this.callOpt.OnServerErr) {
          this.callOpt.OnServerErr(rpc)
        }
        break
      case 5:
        res = this.resType.decode(rpc.body)
        if (this.callOpt.OnResult) {
          this.callOpt.OnResult(res, rpc)
        }
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
  private wsReconnectTmrId: number = -1
  private cid: number = 0

  OnceSubscribeList: Map<string, Function[]> = new Map<string, Function[]>()
  SubscribeList: Map<string, Function[]> = new Map<string, Function[]>()


  initWsCon(url: string) {

    if (this.wsCon) {
      this.wsCon.close()
    }

    this.wsCon = new WebSocket(url)
    this.wsUrl = url

    this.wsCon.onmessage = this.onWsMsg
    this.wsCon.onclose = this.onWsClose
    this.wsCon.onerror = this.onWsErr
    this.wsCon.onopen = this.onWsOpen

  }


  isWsConnected(): boolean {
    if (!this.wsCon) {
      return false
    }
    return this.wsCon.readyState === 2
  }

  sendRpcData(rpcData: Uint8Array): boolean {
    if (!this.wsCon) {
      return false
    }
    if (this.wsCon.readyState !== 2) {
      return false
    }

    this.wsCon.send(rpcData)
    this.LastSendTime = Date.now()
    return true
  }

  sendRpc(rpc: yrpc.Ymsg): boolean {
    let w = yrpc.Ymsg.encode(rpc)
    let rpcData = w.finish()
    return this.sendRpcData(rpcData)
  }

  onWsMsg(ev: MessageEvent): void {
    this.LastRecvTime = Date.now()
    let rpcData = new Uint8Array(ev.data)
    let rpc = yrpc.Ymsg.decode(rpcData)

    if (rpc.body.length > 0) {
      let zipType = rpc.cmd & 0x000f0000
      switch (zipType) {
        case 0x00010000://lz4
          throw new Error("no lz4 support now")
        case 0x00020000://zlib
          rpc.body = pako.inflate(rpc.body)
          break
      }

    }
    if (rpc.optbin.length > 0) {
      let zipType = rpc.cmd & 0x00f00000
      switch (zipType) {
        case 0x00100000://lz4
          throw new Error("no lz4 support now")
        case 0x00200000://zlib
          rpc.optbin = pako.inflate(rpc.optbin)
          break
      }
    }

    rpc.cmd = rpc.cmd & 0xffff
    switch (rpc.cmd) {
        // publish response
      case 11:
        break

        // sub/unsub response
      case 12:
        break

        // nats recv msg
      case 13:
        break
    }

  }

  onWsErr(ev: Event): void {
    console.log("ws err:", ev);
  }

  onWsClose(ev: CloseEvent): void {
    this.wsCon = null
    console.log("ws closed:", ev)

    this.wsReconnectTmrId = window.setInterval(() => {
      if (this.isWsConnected()) {
        clearInterval(this.wsReconnectTmrId)
        return
      }
      this.initWsCon(this.wsUrl)
    }, 5000)
  }

  onWsOpen(ev: Event) {
    console.log("ws open:", ev);
  }


  //return cid in rpccmd, <0: not send
  NatsPublish(subject: string, data: Uint8Array, natsOpt?: yrpc.NatsOption): number {
    if (!this.isWsConnected()) {
      return -1
    }

    let rpc = new yrpc.Ymsg()
    rpc.cmd = 11
    rpc.cid = this.NewCid()
    rpc.optstr = subject
    rpc.body = data

    if (natsOpt) {
      let w = yrpc.NatsOption.encode(natsOpt)
      rpc.optbin = w.finish()
    }
    this.sendRpc(rpc)
    return rpc.cid
  }

  NatsSubsribe(subject: string, FnMsg: Function): boolean {
    if (!this.isWsConnected()) {
      return false
    }
    let hasExist = isCallbackInMap(subject, FnMsg, this.SubscribeList)
    if (hasExist) {
      return true
    }
    let rpc = new yrpc.Ymsg()
    rpc.cmd = 12
    rpc.res = 1
    rpc.cid = this.NewCid()
    rpc.optstr = subject

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
    let rpc = new yrpc.Ymsg()
    rpc.cmd = 12
    rpc.res = 1
    rpc.cid = this.NewCid()
    rpc.optstr = subject

    addCallback2Map(subject, FnMsg, this.OnceSubscribeList)

    return this.sendRpc(rpc)
  }

  NatsUnsubsribe(subject: string, FnMsg?: Function) {
    let rpc = new yrpc.Ymsg()
    rpc.cmd = 12
    rpc.res = 2
    rpc.cid = this.NewCid()
    rpc.optstr = subject
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

  ping(): void {
    let rpc = new yrpc.Ymsg()
    rpc.cmd = 3
    this.sendRpc(rpc)

  }

  NocareCall(reqData: Uint8Array, api: string, v: number): void {
    let rpc = new yrpc.Ymsg()
    if (v > 0) {
      rpc.cmd = 10 | (v << 24)

    } else {
      rpc.cmd = 10
    }
    rpc.body = reqData
    rpc.optstr = api

    this.sendRpc(rpc)
  }

  UnaryCall(reqData: Uint8Array, api: string, v: number, resType: any, callOpt?: TCallOption) {
    let rpc = new yrpc.Ymsg()

    if (v > 0) {
      rpc.cmd = 1 | (v << 24)

    } else {
      rpc.cmd = 1
    }
    rpc.sid = rpcCon.Sid
    rpc.cid = rpcCon.NewCid()
    rpc.body = reqData
    rpc.optstr = api

    let sendOk = this.sendRpc(rpc)

    if (!callOpt) {
      return
    }

    if (!sendOk) {
      callOpt?.OnLocalErr?.("can not send to socket")
      return
    }
    if (callOpt.timeout <= 0) {
      callOpt.timeout = 30
    }
    let timeoutId: number = window.setTimeout(() => {
      ypubsub.unsubscribeInt(rpc.cid)
      callOpt?.OnTimeout?.()
    }, callOpt.timeout * 1000)


    ypubsub.subscribeOnceInt(rpc.cid, function (resRpc: yrpc.Ymsg) {
      switch (resRpc.cmd) {
        case 2:
          let res = resType.decode(resRpc.body)
          callOpt?.OnResult?.(res, resRpc)
          break;
        case 4:
          callOpt?.OnServerErr?.(resRpc)
          break
        default:
          console.log("unary call bad:res:", resRpc);
      }
      clearTimeout(timeoutId)
    })

  }

}

export let rpcCon = new TrpcCon()
