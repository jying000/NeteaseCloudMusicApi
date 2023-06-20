// 歌曲链接

const crypto = require('crypto')
const path = require('path')
const fs = require('fs')

module.exports = (query, request) => {
  // console.log(query);
  // 先检索是否有本地目录记录
  const txtpath = path.join(__dirname, '..', 'download', '本地目录.txt')
  if (query.artist != null && fs.existsSync(txtpath)) {
    let txt = fs.readFileSync(txtpath)
    // console.log(txt.toString());
    try {
      let musicList = JSON.parse('[' + txt.toString() + '{}]')
      console.log(musicList)
      if (musicList != null && musicList.length > 0) {
        let music = musicList.find((item) => {
          return item.artist == query.artist && item.name == query.name
        })
        if (music != null) {
          music.url =
            'files/' +
            music.artist +
            '/' +
            music.artist +
            ' - ' +
            music.name +
            '.mp3'
          music.local = true
          return {
            status: 200,
            body: {
              code: 200,
              data: [music],
            },
          }
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  console.log('从网络获取歌曲地址')
  // if (!('MUSIC_U' in query.cookie))
  //   query.cookie._ntes_nuid = crypto.randomBytes(16).toString('hex')
  query.cookie.os = 'pc'
  const data = {
    ids: '[' + query.id + ']',
    br: parseInt(query.br || 999000),
  }
  return request(
    'POST',
    `https://interface3.music.163.com/eapi/song/enhance/player/url`,
    data,
    {
      crypto: 'eapi',
      cookie: query.cookie,
      proxy: query.proxy,
      realIP: query.realIP,
      url: '/api/song/enhance/player/url',
    },
  )
}
