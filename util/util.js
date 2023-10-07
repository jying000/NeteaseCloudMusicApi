// const xml2js = require('xml2js');

const getQueryFromUrl = (key, search) => {
  try {
    const sArr = search.split('?')
    let s = ''
    if (sArr.length > 1) {
      s = sArr[1]
    } else {
      return key ? undefined : {}
    }
    const querys = s.split('&')
    const result = {}
    querys.forEach((item) => {
      const temp = item.split('=')
      result[temp[0]] = decodeURIComponent(temp[1])
    })
    return key ? result[key] : result
  } catch (err) {
    // 除去search为空等异常
    return key ? '' : {}
  }
}

const changeUrlQuery = (obj, baseUrl = '') => {
  const query = getQueryFromUrl(null, baseUrl)
  let url = baseUrl.split('?')[0]

  const newQuery = { ...query, ...obj }
  let queryArr = []
  Object.keys(newQuery).forEach((key) => {
    if (newQuery[key] !== undefined && newQuery[key] !== '') {
      queryArr.push(`${key}=${encodeURIComponent(newQuery[key])}`)
    }
  })
  return `${url}?${queryArr.join('&')}`.replace(/\?$/, '')
}

const getId = (url = '/') => {
  return url.match(/\/([^\/]+)$/)[1]
}

const getBatchSong = async (cids = [], request_callback) => {
  const songs = await request_callback(
    `https://music.migu.cn/v3/api/music/audioPlayer/songs?type=1&copyrightId=${cids.join(
      ',',
    )}`,
    { resource: 'migu' },
  ).catch((err) => {
    console.error('出错啦！！！')
    console.error(err)
    return { items: [] }
  })

  console.log(JSON.stringify(songs))
  return (songs.items || []).map(
    ({
      copyrightId,
      length = '00:00:00',
      songName,
      singers = [],
      albums = [],
      mvList = [],
      songId,
    }) => ({
      id: songId,
      cid: copyrightId,
      name: songName,
      artists: singers.map(({ artistId, artistName }) => ({
        id: artistId,
        name: artistName,
      })),
      album: albums[0]
        ? { id: albums[0].albumId, name: albums[0].albumName }
        : undefined,
      duration:
        length
          .split(':')
          .reduce((t, v, i) => t + Number(v) * Math.pow(60, 2 - i), 0) * 1000,
      mvId: mvList[0] ? mvList[0].mvId : undefined,
      mvCid: mvList[0] ? mvList[0].copyrightId : undefined,
      lyric: '', //因为migu获取不到歌词，而前端根据是否为null判断是否调用接口，此处全部设为空字符''
    }),
  )
}

// const handleXml = (data) => {
//   return new Promise((resolve, reject) => {
//     const handleObj = (obj) => {
//       Object.keys(obj).forEach((k) => {
//         const v = obj[k];
//         if ((typeof v).toLowerCase() === 'object' && v instanceof Array && v.length === 1) {
//           obj[k] = v[0];
//         }
//         if ((typeof obj[k]).toLowerCase() === 'object') {
//           handleObj(obj[k]);
//         }
//       })
//     };

//     xml2js.parseString(data, (err, result) => {
//       handleObj(result);
//       resolve(result);
//     })
//   })
// }

module.exports = { getQueryFromUrl, changeUrlQuery, getId, getBatchSong }
