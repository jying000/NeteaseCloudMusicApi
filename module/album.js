// 专辑内容
const util = require('../util/util.js')
const cheerio = require('cheerio')

module.exports = async (query, request) => {
  if (query.resource != null && query.resource == 'migu') {
    const { id } = query
    if (!id) {
      return {
        status: 500,
        errMsg: '小老弟，id 呢?',
      }
    }
    const result = await request(`http://music.migu.cn/v3/music/album/${id}`, {
      dataType: 'raw',
      resource: 'migu',
    })

    const $ = cheerio.load(result)

    const description = $('.content .intro').text()
    const name = $('.content .title').text()
    const publishTime = $('.content .pub-date')
      .text()
      .replace(/[^\d|-]/g, '')
    const picUrl = $('.mad-album-info .thumb-img').attr('src')
    let songList = []
    const artists = []
    const company = $('.pub-company')
      .text()
      .replace(/^发行公司：/, '')
    $('.singer-name a').each((i, o) => {
      artists.push({
        id: util.getId($(o).attr('href')),
        name: $(o).text(),
      })
    })
    // 歌曲列表
    // $('.songlist-body .J_CopySong').each((i, o) => {
    //   const ar = [];
    //   const $song = $(o);
    //   $song.find('.song-singers a').each((i, o) => {
    //     ar.push({
    //       id: util.getId($(o).attr('href')),
    //       name: $(o).text()
    //     })
    //   });
    //   songList.push({
    //     name: $song.find('.song-name-txt').text(),
    //     id: $song.attr('data-mid'),
    //     cid: $song.attr('data-cid'),
    //     artists: ar,
    //     album: {
    //       name,
    //       id,
    //     }
    //   })
    // });
    // 改为从接口获取
    if (!!picUrl) {
      const songs = await request(
        `http://m.music.migu.cn/migu/remoting/cms_album_song_list_tag?albumId=${id}&pageSize=100`,
        { resource: 'migu' },
      )
      // console.log("俺是歌曲列表：", JSON.stringify(songs));
      songList = songs.result.results.map(
        ({
          picM,
          listenUrl,
          lisCr,
          lisQq,
          singerId,
          singerName,
          songId,
          songName,
          mvCopyrightId,
          copyrightId,
        }) => ({
          id: songId,
          name: songName,
          url: listenUrl || lisQq || lisCr,
          copyrightId,
          mvCid: mvCopyrightId,
          album: {
            picUrl: picM,
            name: name,
          },
          artists: singerId.map((id, i) => ({
            id,
            name: singerName[i],
          })),
        }),
      )
    }

    const data = {
      name,
      id,
      artist: artists[0],
      artists,
      company,
      publishTime,
      picUrl,
      description,
      info: {
        likedCount: '未知',
        shareCount: '未知',
      },
    }

    return {
      status: 200,
      body: {
        code: 200,
        album: data,
        songs: songList,
      },
    }
  }

  return request(
    'POST',
    `https://music.163.com/weapi/v1/album/${query.id}`,
    {},
    {
      crypto: 'weapi',
      cookie: query.cookie,
      proxy: query.proxy,
      realIP: query.realIP,
    },
  )
}
