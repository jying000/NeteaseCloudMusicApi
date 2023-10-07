// 搜索咪咕
module.exports = async (query, request_callback) => {
  query.type = query.type || 'song'
  if (!query.keywords) {
    return {
      status: 500,
      body: {
        code: 500,
        data: '搜啥呢？',
      },
    }
  }

  const { keywords, offset = 1, limit = 20, resource } = query
  const typeMap = {
    song: 2,
    singer: 1,
    album: 4,
    playlist: 6,
    mv: 5,
    lyric: 7,
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
        data: {
          list: [],
          total: 0,
        },
      },
    }
  }

  let data
  switch (query.type) {
    case 'lyric':
    case 'song':
      data = (result.musics || []).map(
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
          mvCopyrightId,
        }) => {
          // console.log({ songName, singerId, singerName, albumName, albumId, mp3, cover, id, copyrightId, mvId, mvCopyrightId });
          const singerIds = singerId.replace(/\s/g, '').split(',')
          const singerNames = singerName.replace(/\s/g, '').split(',')
          const artists = singerIds.map((id, i) => ({
            id,
            name: singerNames[i],
          }))
          return {
            name: songName,
            id,
            cid: copyrightId,
            mvId,
            mvCid: mvCopyrightId,
            url: mp3,
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
    case 'singer':
      data = result.artists.map(
        ({ title, id, songNum, albumNum, artistPicM }) => ({
          name: title,
          id,
          picUrl: artistPicM,
          songCount: songNum,
          albumCount: albumNum,
        }),
      )
      break
    case 'album':
      data = result.albums.map(
        ({ albumPicM, singer, songNum, id, publishDate, title }) => ({
          name: title,
          id,
          artists: singer,
          songCount: songNum,
          publishTime: publishDate,
          picUrl: albumPicM,
        }),
      )
      break
    case 'playlist':
      data = result.songLists.map(
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
    case 'mv':
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
      data: data,
    },
  }
}
