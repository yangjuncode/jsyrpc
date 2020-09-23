import { getEnv, ENV_TYPE } from './env'
import * as socketTypes from './socket.types'
import { implUniSocket } from './uni.socket'
import { implWebSocket } from './web.socket'
import { implWxSocket } from './wx.socket'
import { implMySocket } from './my.socket'

const env = getEnv()

// 优先判断是否多端环境，多端环境下，框架已经实现统一的WebSocket接口
function getRpcSocket(): socketTypes.IRpcSocket {
  // 多端环境
  if (env === ENV_TYPE.UNI) {
    return implUniSocket()
  }
  if (env === ENV_TYPE.TARO) {
    // @ts-ignore
    return taro
  }

  // 浏览器环境(非多端浏览器环境)
  if (env === ENV_TYPE.WEB) {
    return implWebSocket()
  }

  // 各类小程序环境
  // 微信小程序
  if (env === ENV_TYPE.WX) {
    return implWxSocket()
  }
  // 支付宝小程序
  if (env === ENV_TYPE.MY) {
    return implMySocket()
  }

  throw new Error('not impl rpc socket!!! env: ' + env)
}

export const rpcSocket = getRpcSocket()
