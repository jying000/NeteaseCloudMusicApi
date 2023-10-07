// @ts-ignore
const { default: axios } = require('axios')
const util = require('./util.js')

const requestMigu = async (options, opts = {}) => {
  try {
    if (typeof options === 'string') {
      options = { url: options }
    }
    options.method = options.method || 'get'

    const { url, data, method } = options
    const { dataType } = opts

    if (method === 'get') {
      options.url = util.changeUrlQuery(data, url)
      delete options.data
    }

    // const cookieObj = (Number(query.ownCookie) ? cookies : userCookie) || {};
    options.headers = options.headers || {}
    options.headers.referer =
      options.headers.referer || 'http://m.music.migu.cn/v3'
    options.xsrfCookieName = 'XSRF-TOKEN'
    options.withCredentials = true
    // options.headers.Cookie = Object.keys(cookieObj).map((k) => `${k}=${cookieObj[k]}`).join('; ');

    //@ts-ignore
    const res = await axios(options)

    if (dataType === 'xml') {
      return util.handleXml(res.data)
    }

    if (dataType === 'raw') {
      return res.data
    }

    if (typeof res.data === 'string') {
      res.data = res.data.replace(
        /callback\(|MusicJsonCallback\(|jsonCallback\(|\)$/g,
        '',
      )
      return JSON.parse(res.data)
    }

    return res.data
  } catch (err) {
    if (err.message === 'Request failed with status code 503') {
      console.log('retry')
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(requestMigu(options, opts))
        }, 300)
      })
    }
    if (err.code == 'ETIMEDOUT') {
      console.error('接口超时，未获取到结果')
    } else {
      console.error('出错啦！！！', err)
    }
    return {}
  }
}

module.exports = requestMigu
