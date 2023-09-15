// 下载歌曲

//引入相关资源包
const http = require('http')
const https = require('https')
const path = require('path')
const fs = require('fs')

module.exports = async (query) => {
  const url = query.url
  const artist = query.artist
  const fileName =
    query.artist + ' - ' + query.name.replace(/[\\\/:\*\?"<>\|]/g, ' ') + '.mp3'
  var dir = query.dir
  if (dir == null || dir.trim().length == 0) {
    dir = path.join(__dirname, '..', 'download', artist)
  }
  // console.log('------------------------------------------------')
  // console.log(query);
  // console.log(url)
  // console.log(artist);
  // console.log(fileName)
  // console.log(dir);
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      console.log('------------------------------------------------')
      console.log(`新创建文件夹${dir}`)
    }
    // 判断 URL 协议类型，使用对应的模块
    const protocol = url.startsWith('https') ? https : http

    // 创建请求
    const req = await protocol.get(url, (res) => {
      if (res.statusCode !== 200) {
        console.error(`下载失败：状态码 ${res.statusCode}`)
        return
      }

      // 创建可写流，写入文件
      const fileStream = fs.createWriteStream(path.join(dir, fileName))
      res
        .on('error', (err) => {
          console.error(`下载失败：${err.message}`)
          return {
            status: 500,
            body: {
              code: 500,
              data: '下载失败',
            },
          }
        })
        .pipe(fileStream)
        .on('error', (err) => {
          console.error(`存储失败：${err.message}`)
          return {
            status: 500,
            body: {
              code: 500,
              data: '下载存储失败',
            },
          }
        })

      // 监听可写流的 finish 事件，表示数据已经写入完成
      fileStream.on('finish', () => {
        console.log('下载完成，更新本地索引目录')
        fileStream.close()
        dir = path.join(__dirname, '..', 'download', 'download.json')
        query.url = undefined
        query.cookie = undefined
        query.src = undefined
        query.index = undefined
        if (!fs.existsSync(dir)) {
          fs.writeFileSync(dir, JSON.stringify(query) + ',\n')
        } else {
          fs.appendFileSync(dir, JSON.stringify(query) + ',\n')
        }
      })
    })

    // // 监听请求的 error 事件
    // req.on('error', (err) => {
    //   console.error(`下载失败：${err.message}`)
    //   return {
    //     status: 500,
    //     body: {
    //       code: 500,
    //       data: '下载失败',
    //     },
    //   }
    // })

    return {
      status: 200,
      body: {
        code: 200,
        data: 'ok',
      },
    }
  } catch (err) {
    console.error(err)
    return {
      status: 500,
      body: {
        code: 500,
        data: err,
      },
    }
  }
}
