export const ENV_TYPE = {
  // web浏览器
  WEB: 'WEB',
  // 微信小程序 wx.xxx
  WX: 'WX',
  // 支付宝小程序 my.xxx
  MY: 'MY',
  // 京东小程序 jd.xxx
  JD: 'JD',
  // QQ小程序 qq.xxx
  QQ: 'QQ',
  // 字节跳动小程序 tt.xxx
  TT: 'TT',
  // 百度小程序 swan.xxx
  SWAN: 'SWAN',

  // 以下为多端框架环境
  // uni-app  uni.xxx vue环境
  UNI: 'UNI',
  // taro taro.xxx react环境
  TARO: 'TARO',
}

let _env: string | null = null

// 同一个项目肯定运行同样的环境
export function getEnv(): string {
  if (_env) return _env

  // 多端框架判断
  // @ts-ignore
  if (typeof uni !== 'undefined' && uni.getSystemInfo) {
    _env = ENV_TYPE.UNI
    return _env
  }
  // @ts-ignore
  if (typeof taro !== 'undefined' && taro.getSystemInfo) {
    _env = ENV_TYPE.TARO
    return _env
  }

  // 浏览器环境
  if (typeof window !== 'undefined') {
    _env = ENV_TYPE.WEB
    return _env
  }

  // 各类小程序环境
  // @ts-ignore
  if (typeof wx !== 'undefined' && wx.getSystemInfo) {
    _env = ENV_TYPE.WX
    return _env
  }
  // @ts-ignore
  if (typeof my !== 'undefined' && my.getSystemInfo) {
    _env = ENV_TYPE.MY
    return _env
  }
  // @ts-ignore
  if (typeof jd !== 'undefined' && jd.getSystemInfo) {
    _env = ENV_TYPE.JD
    return _env
  }
  // @ts-ignore
  if (typeof qq !== 'undefined' && qq.getSystemInfo) {
    _env = ENV_TYPE.QQ
    return _env
  }
  // @ts-ignore
  if (typeof tt !== 'undefined' && tt.getSystemInfo) {
    _env = ENV_TYPE.TT
    return _env
  }
  // @ts-ignore
  if (typeof swan !== 'undefined' && swan.getSystemInfo) {
    _env = ENV_TYPE.SWAN
    return _env
  }

  throw new Error('Unknown environment')
}
