const superagent = require('superagent')
const fs = require('fs')
const path = require('path')

getData = async () => {
    let {
        body
    } = await superagent.get("http://api.tianapi.com/txapi/ncovcity/index?key=da05eff01b87e74005064c28764a98e3")
    let list = body.newslist.map(item => {
        return {
            name: item.provinceShortName,
            value: item.confirmedCount
        }
    })
    list = JSON.stringify(list)
    fs.writeFileSync(path.join(__dirname, 'cacheData/dataMock.json'), list, (content, err) => {
        console.log(err)
    })
}


var CronJob = require('cron').CronJob;
const job = new CronJob('0 35 * * * *', function () {
    getData()
})

job.start()