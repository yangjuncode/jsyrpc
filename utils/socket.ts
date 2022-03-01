import { getEnv } from './env'
import * as socketTypes from './socket.types'
import { DEV } from './common'

import * as my_socket from '../sockets/my.socket'
import * as uni_socket from '../sockets/uni.socket'
import * as web_socket from '../sockets/web.socket'
import * as wx_socket from '../sockets/wx.socket'

const modules: { [key: string]: any } = {
  my_socket,
  uni_socket,
  web_socket,
  wx_socket,
}

const env = getEnv()

// 根据程序运行环境，加载统一的WebSocket接口模块
function getRpcSocket(): socketTypes.IRpcSocket {

  try {
    //  const socketModule = require(`../sockets/${env.toLowerCase()}.socket`)
    const socketModule = modules[env.toLowerCase() + '_socket']
    console.log('jsyrpc socketModule:', socketModule)
    return socketModule.implSocket()
  } catch (e) {
    DEV && console.error('getRpcSocket:', e)
    throw new Error('not impl rpc socket!!! env: ' + env)
  }
}

export const rpcSocket = getRpcSocket()
