// 歌单详情
const util = require('../util/util.js')
const cheerio = require('cheerio')

module.exports = async (query, request_callback) => {
  if (query != null && query.resource == 'migu') {
    const { id } = query
    const playListRes = await request_callback({
      url: `http://m.music.migu.cn/migu/remoting/query_playlist_by_id_tag?onLine=1&queryChannel=0&createUserId=migu&contentCountMin=5&playListId=${id}`,
      data: query,
    })

    const listInfo = null

    if (
      playListRes != null &&
      playListRes.rsp != null &&
      playListRes.rsp.playList != null &&
      playListRes.rsp.playList.length > 0
    ) {
      listInfo = playListRes.rsp.playList[0]
    }
    // console.log("我是playlist_detail：", listInfo);

    if (!listInfo) {
      return {
        status: 500,
        body: {
          code: 500,
          msg: playListRes.info || '服务异常',
        },
      }
    }

    const {
      playListName,
      createName,
      createUserId,
      playCount,
      collecCount,
      contentCount,
      image,
      summary,
      createTime,
      updateTime,
      tagLists,
      playListType,
    } = listInfo
    const tags = tagLists.map((item) => {
      return item.tagName
    })
    const baseInfo = {
      id,
      name: playListName,
      coverImgUrl: image,
      playCount,
      subscribedCount: collecCount,
      trackCount: contentCount,
      description: summary,
      creator: {
        id: createUserId,
        nickname: createName || '',
      },
      createTime,
      updateTime,
      tags,
      list: [],
    }

    // console.log(baseInfo);
    const cids = []

    let pageNo = 1
    while ((pageNo - 1) * 20 < 1) {
      const listPage = await request_callback(
        `https://music.migu.cn/v3/music/playlist/${id}?page=${pageNo}`,
        {
          dataType: 'raw',
          resource: 'migu',
        },
      )
      const $ = cheerio.load(listPage)
      // console.log($('.row.J_CopySong'));

      $('.row.J_CopySong').each((i, v) => {
        // console.log($(v).attr('data-cid'));
        cids.push($(v).attr('data-cid'))
      })

      pageNo += 1
    }

    baseInfo.list = await util.getBatchSong(cids, request_callback)

    return {
      status: 200,
      body: {
        code: 200,
        playlist: baseInfo,
      },
    }
  }

  // neteasy 数据
  const data = {
    id: query.id,
    n: 100000,
    s: query.s || 8,
  }
  return request_callback(
    'POST',
    `https://music.163.com/api/v6/playlist/detail`,
    data,
    {
      crypto: 'api',
      cookie: query.cookie,
      proxy: query.proxy,
      realIP: query.realIP,
    },
  )
}
