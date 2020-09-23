import { getEnv } from './env'
import * as socketTypes from './socket.types'
import { DEV } from './common'

const env = getEnv()

// 根据程序运行环境，加载统一的WebSocket接口模块
function getRpcSocket(): socketTypes.IRpcSocket {
  try {
    const socketModule = require(`../sockets/${env.toLowerCase()}.socket`)
    return socketModule.implSocket()
  } catch (e) {
    DEV && console.error('getRpcSocket:', e)
    throw new Error('not impl rpc socket!!! env: ' + env)
  }
}

export const rpcSocket = getRpcSocket()
