// 搜索

const search_neteasy = async (query, request_callback) => {
  if (query.type && query.type == '2000') {
    const data = {
      keyword: query.keywords,
      scene: 'normal',
      limit: query.limit || 30,
      offset: query.offset || 0,
    }
    return request_callback(
      'POST',
      `https://music.163.com/api/search/voice/get`,
      data,
      {
        crypto: 'weapi',
        cookie: query.cookie,
        proxy: query.proxy,
        realIP: query.realIP,
      },
    )
  }
  const data = {
    s: query.keywords,
    type: query.type || 1, // 1: 单曲, 10: 专辑, 100: 歌手, 1000: 歌单, 1002: 用户, 1004: MV, 1006: 歌词, 1009: 电台, 1014: 视频
    limit: query.limit || 100,
    offset: query.offset || 0,
  }
  const result = await request_callback(
    'POST',
    `https://music.163.com/weapi/search/get`,
    data,
    {
      crypto: 'weapi',
      cookie: query.cookie,
      proxy: query.proxy,
      realIP: query.realIP,
    },
  )

  let _data = []
  if (result) {
    if (result.status != 200) {
      return result
    }

    let _result = {}
    switch (query.type) {
      case '1': // 单曲列表
        _data = (result.body.result.songs || []).map((item) => {
          const artists = item.artists.map(({ id, name, picUrl }) => ({
            id,
            name,
            picUrl,
          }))
          return {
            id: item.id,
            name: item.name,
            copyrightId: item.copyrightId,
            mvId: item.mvid,
            url: null,
            lyric: null,
            duration: item.duration,
            album: {
              publishTime: item.album.publishTime,
              picId: item.album.picId,
              picUrl: null,
              name: item.album.name,
              id: item.album.id,
            },
            artists,
          }
        })
        break
      case '100': // singer 歌手
      case '10': // 专辑
      case '1000': // playlist 歌单
      case '1004': //mv
        return result
      default:
        console.log('没有获取到任何数据')
        break
    }
  }

  return {
    status: 200,
    body: {
      code: 200,
      result: _data,
    },
  }
}

const search_migu = async (query, request_callback) => {
  query.type = query.type || 'song'
  if (!query.keywords) {
    return {
      status: 500,
      body: {
        code: 500,
        result: '搜啥呢？',
      },
    }
  }

  const { keywords, offset = 1, limit = 100, resource } = query
  // const typeMap = {
  //   song: 2,
  //   singer: 1,
  //   album: 4,
  //   playlist: 6,
  //   mv: 5,
  //   lyric: 7,
  // };
  const typeMap = {
    1: 2,
    100: 1,
    10: 4,
    1000: 6,
    1004: 5,
    1006: 7,
  }

  const result = await request_callback({
    url: 'https://m.music.migu.cn/migu/remoting/scr_search_tag',
    data: {
      keyword: keywords,
      pgc: offset,
      rows: limit,
      resource: resource,
      type: typeMap[query.type],
    },
  })
  // console.log("我是migu结果：", result);

  if (!result) {
    return {
      status: 200,
      body: {
        code: 200,
        result: [],
      },
    }
  }

  let _result = {}
  let data = {}
  switch (query.type) {
    case '1006':
    case '1': // 单曲列表
      console.log('我是pgt=', result.pgt)
      data = result.musics || []
      data = await getSongList(
        keywords,
        offset,
        result.pgt,
        data,
        request_callback,
      )

      data = data.map(
        ({
          songName,
          singerId,
          singerName,
          albumName,
          albumId,
          mp3,
          cover,
          id,
          copyrightId,
          mvId,
          lyrics,
        }) => {
          // console.log({ songName, singerId, singerName, albumName, albumId, mp3, cover, id, copyrightId, mvId, mvCopyrightId });
          const singerIds = singerId.replace(/\s/g, '').split(',')
          const singerNames = singerName.replace(/\s/g, '').split(',')
          const artists = singerIds.map((id, i) => ({
            id,
            name: singerNames[i],
          }))
          return {
            id,
            name: songName,
            copyrightId,
            mvId,
            url: mp3,
            lyric: lyrics, // 歌词地址无用，打不开
            album: {
              picUrl: cover,
              name: albumName,
              id: albumId,
            },
            artists,
          }
        },
      )
      break
    case '100': // singer 歌手，暂不使用
      _result.artistCount = result.artists.length
      _result.artists = result.artists.map(
        ({ title, id, songNum, albumNum, artistPicM }) => ({
          name: title,
          id,
          picUrl: artistPicM,
          songCount: songNum,
          albumSize: albumNum,
        }),
      )
      data = _result
      break
    case '10': // album 专辑
      console.log(JSON.stringify(result))
      _result.albumCount = result.pgt
      _result.albums = result.albums.map(
        ({ albumPicM, singer, songNum, id, publishDate, title }) => ({
          name: title,
          id,
          artists: singer,
          size: songNum,
          publishTime: publishDate,
          picUrl: albumPicM,
        }),
      )
      data = _result
      break
    case '1000': // playlist 歌单
      data.playlists = result.songLists.map(
        ({ name, img, id, playNum, musicNum, userName, userId, intro }) => ({
          name,
          id,
          picUrl: img,
          playCount: playNum,
          songCount: musicNum,
          intro,
          creator: {
            name: userName,
            id: userId,
          },
        }),
      )
      break
    case '1004': //mv
      data = result.mv.map(
        ({
          songName,
          id,
          mvCopyrightId,
          mvId,
          copyrightId,
          albumName,
          albumId,
          singerName,
          singerId,
        }) => {
          const singerIds = singerId.replace(/\s/g, '').split(',')
          const singerNames = singerName.replace(/\s/g, '').split(',')
          const artists = singerIds.map((id, i) => ({
            id,
            name: singerNames[i],
          }))
          return {
            name: songName,
            id,
            mvId,
            cid: copyrightId,
            mvCid: mvCopyrightId,
            album: {
              name: albumName,
              id: albumId,
            },
            artists,
          }
        },
      )
      break
    default:
      console.log('没有获取到任何数据')
      break
  }

  return {
    status: 200,
    body: {
      code: 200,
      result: data,
    },
  }
}

const getSongList = async (
  keywords,
  offset,
  totalCount,
  data,
  request_callback,
) => {
  if (totalCount > data.length) {
    const result2 = await request_callback({
      url: 'https://m.music.migu.cn/migu/remoting/scr_search_tag',
      data: {
        keyword: keywords,
        pgc: ++offset,
        rows: 100,
        resource: 'migu',
        type: 2,
      },
    })
    data = data.concat(result2.musics || [])
    data = await getSongList(
      keywords,
      offset,
      totalCount,
      data,
      request_callback,
    )
  }
  return data
}

const search = async (query, request_callback) => {
  if (query != null && query.resource == 'migu') {
    return search_migu(query, request_callback)
  } else {
    return search_neteasy(query, request_callback)
  }
}

module.exports = search
