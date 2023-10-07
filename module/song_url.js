// 歌曲链接

const path = require('path')
const fs = require('fs')

module.exports = (query, request) => {
  // console.log(query);
  // 先检索是否有本地目录记录
  const txtpath = path.join(__dirname, '..', 'download', 'download.json')

  if (query.artist != null && fs.existsSync(txtpath)) {
    const txt = fs.readFileSync(txtpath, 'utf-8')
    try {
      let jsonStr = `[` + txt + `{}]`
      let musicList = JSON.parse(jsonStr)
      // console.log(musicList)
      if (musicList != null && musicList.length > 0) {
        let music = musicList.find((item) => {
          return (
            item.artist == query.artist &&
            item.name == query.name.replace(/[\\\/:\*\?"<>\|]/g, ' ')
          )
        })
        // console.log(music);
        if (music != null) {
          music.url =
            'files/' +
            music.artist +
            '/' +
            music.artist +
            ' - ' +
            music.name.replace(/[\\\/:\*\?"<>\|]/g, ' ') +
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
      console.error('出错啦：' + err)
    }
  }

  // 如果是migu，则直接返回
  if (query != null && query.resource == 'migu') {
    return {
      status: 200,
      body: {
        code: 200,
        data: [query],
      },
    }
  }

  // console.log('从网络获取歌曲地址')
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
