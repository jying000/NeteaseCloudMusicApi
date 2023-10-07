// 歌词

module.exports = async (query, request) => {
  if (query.resource != null && query.resource == 'migu') {
    const { cid } = query

    if (!cid) {
      return {
        status: 500,
        body: 'cid呢小老弟',
      }
    }

    const result = await request(
      `http://music.migu.cn/v3/api/music/audioPlayer/getLyric?copyrightId=${cid}`,
      { resource: 'migu' },
    )

    if (result.msg === '成功') {
      return {
        status: 200,
        body: {
          code: 200,
          lrc: { lyric: result.lyric },
        },
      }
    }

    return {
      status: 200,
      body: {
        code: 200,
        lrc: {
          lyric: '[00:00.00]未获取到歌词 或 接口报错',
        },
      },
    }
  }

  query.cookie.os = 'ios'

  const data = {
    id: query.id,
    tv: -1,
    lv: -1,
    rv: -1,
    kv: -1,
  }
  return request(
    'POST',
    `https://music.163.com/api/song/lyric?_nmclfl=1`,
    data,
    {
      crypto: 'api',
      cookie: query.cookie,
      proxy: query.proxy,
      realIP: query.realIP,
    },
  )
}
