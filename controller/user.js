const DBUser = require('../connection/user')
const DBULeaveInfo = require('../connection/leavInfo')
const DBCollege = require('../connection/college')
const DBDestination = require('../connection/destination')
const jwt = require('jsonwebtoken')
const {
    secret
} = require('../config')
const {
    CLIENTID,
    REDIRECTURL,
    CLIENTSECTET
} = require('../config')
const superagent = require('superagent')


//缓存数据
const dataList = require('../cacheData/dataList.json')
const dataMock = require('../cacheData/dataMock.json')
const dataAllData = require('../cacheData/dataAllData.json')

const cityHosDataList = require('../cacheData/cityHosDataList.js')
const nodemailer = require('nodemailer')

async function main({
    str,
    qq
}) {
    let transporter = nodemailer.createTransport({
        host: "smtp.qq.com",
        port: 465,
        secure: true,
        auth: {
            user: "2273049646@qq.com",
            pass: "nlmnrkmffzbvebhj",
        },
    });

    await transporter.sendMail({
        from: '2273049646@qq.com', // sender address
        to: qq, // list of receivers
        subject: "订阅疫苗邮件", // Subject line
        text: str, // plain text body
    }, (err, res) => {
        console.log(err, res)
    })
}


class User {
    //登陆
    async login(ctx) {
        let {
            user: sid,
            password
        } = await ctx.request.body
        let res = await DBUser.findOne({
            sid
        }).select('+password')
        if (res && res.password === password) {
            const token = jwt.sign({
                name: res.name,
                sid: res.sid,
                sex: res.sex,
                college: res.college,
                admin: res.admin,
                local: res.local,
            }, secret, {
                expiresIn: '24h'
            })

            ctx.body = {
                msg: '登陆成功',
                status: '200',
                token
            }
        } else {
            ctx.body = {
                msg: '登陆失败，账号或者密码错误',
                status: '201'
            }
        }
    }

    //套取疫情图地图
    async worldMap(ctx) {
        ctx.body = {
            status: '200',
            msg: '获取成功',
            data: dataMock
        }
    }

    //获取疫情列表的数据
    async worldMapList(ctx) {
        ctx.body = {
            status: '200',
            msg: '获取成功',
            data: dataAllData
        }
    }

    //获取安科的数据
    async ankeMap(ctx) {
        let res = await DBCollege.find()
        ctx.body = {
            status: '200',
            msg: "获取数据成功",
            data: res
        }
    }

    //更改安科的学校数据
    async ankeMapManage(ctx) {
        let res = ctx.request.body
        for (let i in res) {
            let key = res[i]['key']
            delete res[i].__v
            delete res[i]._id
            delete res[i].key
            await DBCollege.updateOne({
                _id: key
            }, {
                ...res[i]
            })
        }
        ctx.body = {
            status: '200',
            msg: '修改成功'
        }
    }

    //获取医院列表的接口
    async vacFind(ctx) {
        let res = cityHosDataList
        ctx.body = {
            status: '200',
            msg: '获取成功',
            data: res
        }
    }

    //判断邮箱是否已经绑定
    async hasEmail(ctx) {
        let token = ctx.request.headers.authorization.split(' ')[1]
        let TokenUser = jwt.verify(token, secret)
        let res = await DBUser.findOne({
            sid: TokenUser.sid
        })
        if (res && res.email) {
            ctx.body = {
                data: {
                    isTrue: true,
                    emailTime: res.emailTime,
                    email: res.email
                },
                msg: '获取成功',
                status: '200'
            }
        } else {
            ctx.body = {
                data: {
                    isTrue: false
                },
                msg: '获取成功',
                status: '200'
            }
        }
    }

    //对邮箱进行绑定
    async bindEmail(ctx) {
        let token = ctx.request.headers.authorization.split(' ')[1]
        let TokenUser = jwt.verify(token, secret)
        let res = await DBUser.findOne({
            sid: TokenUser.sid
        })
        let {
            emailTime,
            email
        } = ctx.request.body
        if (res.email === '') {
            await DBUser.updateOne({
                sid: res.sid
            }, {
                email: email,
                emailTime: emailTime
            })
            ctx.body = {
                msg: '绑定成功',
                status: '200'
            }
            main({
                str: '你已经成功订阅，请留意邮箱信息哦！',
                qq: email
            })
        } else {
            ctx.body = {
                msg: '请不要重复绑定',
                status: '201'
            }
        }
    }

    //解除邮箱绑定
    async untieEmail(ctx) {
        let token = ctx.request.headers.authorization.split(' ')[1]
        let TokenUser = jwt.verify(token, secret)
        let res = await DBUser.findOne({
            sid: TokenUser.sid
        })
        if (res.email !== '') {
            await DBUser.updateOne({
                sid: res.sid
            }, {
                email: '',
                emailTime: ''
            })
            ctx.body = {
                msg: '解绑成功',
                status: '200'
            }
        } else {
            ctx.body = {
                msg: '邮件并未绑定',
                status: '201'
            }
        }
    }

    //展示订阅的人
    async showEmail(ctx) {
        let res = await DBUser.find()
        ctx.body = {
            status: "200",
            msg: '获取成功',
            data: res
        }
    }

    //请假接口
    async leave(ctx) {
        let token = ctx.request.headers.authorization.split(' ')[1]
        let TokenUser = jwt.verify(token, secret)
        let res = await DBUser.findOne({
            sid: TokenUser.sid
        })
        let params = ctx.request.body
        //改为待审批状态
        let leaveInfo = await DBULeaveInfo.create({
            ...params,
            status: 0
        })
        let id = leaveInfo._id
        await DBUser.updateOne({
            sid: res.sid
        }, {
            leaveInfo: id
        })
        ctx.body = {
            status: '200',
            msg: "申请正在提交",
            data: 0
        }
    }

    //判断是否请假的接口
    async leaveStatus(ctx) {
        let token = ctx.request.headers.authorization.split(' ')[1]
        let TokenUser = jwt.verify(token, secret)
        let res = await DBUser.findOne({
            sid: TokenUser.sid
        }).populate('leaveInfo')
        let data = res.leaveInfo
        if (!data) {
            data = {
                status: 3
            }
        }
        ctx.body = {
            msg: '获取成功',
            status: '200',
            data
        }
    }

    //判断请假目的地的风险区的接口，0低风险，1中风险，2高风险
    async destination(ctx) {
        let {
            destination
        } = ctx.request.query

        let risklevel = 0
        let res = await DBDestination.findOne({
            destination
        })
        if (res) {
            risklevel = res.risklevel
        }
        ctx.body = {
            status: '200',
            msg: '获取成功',
            data: risklevel
        }
    }


    //查询14天中请假的人数
    async sevenDayPersonLeave(ctx) {
        let {
            sevenDateArr
        } = ctx.request.body

        let allDate = await DBUser.find().populate('leaveInfo')
        let arr = []
        allDate.forEach(item => {
            if (item.leaveInfo) {
                arr.push(item.leaveInfo)
            }
        })
        //低风险区
        let low = [],
            mid = [],
            heigh = []
        for (let k = 0; k < 14; k++) {
            low[k] = 0
            mid[k] = 0
            heigh[k] = 0
        }
        console.log(arr)
        for (let i = 0; i < sevenDateArr.length; i++) {
            for (let j = 0; j < arr.length; j++) {
                let maxDate = arr[j].date[1]
                let minDate = arr[j].date[0]
                let Date = sevenDateArr[i]
                let status = arr[j].risklevel
                if (maxDate >= Date && minDate <= Date && arr[j].status === 1) {
                    if (status === 0) {
                        low[i]++
                    } else if (status === 1) {
                        mid[i]++
                    } else if (status === 2) {
                        heigh[i]++
                    }
                }
            }
        }
        ctx.body = {
            status: "200",
            msg: "获取数据成功",
            data: {
                low,
                mid,
                heigh
            }
        }
    }

    //获取审批信息的接口
    async approInfo(ctx) {
        let res = await DBUser.find().populate('leaveInfo')
        let data = JSON.parse(JSON.stringify(res))
        for (let i in data) {
            data[i] = {
                key: data[i]._id,
                ...data[i],
                ...data[i].leaveInfo
            }
            // delete data[i].leaveInfo
        }
        ctx.body = {
            msg: '获取成功',
            status: '200',
            data: data
        }
    }

    //同意审批的接口
    async argeeAppro(ctx) {
        let {
            sid,
            status
        } = ctx.request.body
        let res = await DBUser.findOne({
            sid
        })
        await DBULeaveInfo.updateOne({
            _id: res.leaveInfo
        }, {
            status
        })

        ctx.body = {
            status: "200",
            msg: "审批通过"
        }
    }

    //销假的接口
    async deleteAgree(ctx) {
        let {
            sid
        } = ctx.params
        let res = await DBUser.findOne({
            sid
        })
        if (res.leaveInfo) {
            await DBULeaveInfo.deleteOne({
                _id: res.leaveInfo
            })
        }
        ctx.body = {
            status: "200",
            msg: "删除成功"
        }
    }


    //个人信息的接口
    async personInfo(ctx) {
        let token = ctx.request.headers.authorization.split(' ')[1]
        let TokenUser = jwt.verify(token, secret)
        let res = await DBUser.findOne({
            sid: TokenUser.sid
        }).populate('leaveInfo')
        ctx.body = {
            status: "200",
            msg: "获取个人信息成功",
            data: res
        }
    }

    //易班授权接口
    async auth(ctx) {
        const {
            code
        } = ctx.query
        if (code) {
            //获取令牌
            let res = await superagent.post('https://openapi.yiban.cn/oauth/access_token')
                .field('client_id', CLIENTID)
                .field('redirect_uri', REDIRECTURL)
                .field('code', code)
                .field('client_secret', CLIENTSECTET)

            const {
                status,
                info,
                access_token,
                userid
            } = JSON.parse(res.text)
            if (status === 'error') {
                ctx.body = {
                    status: '201',
                    msg: info
                }
            } else {
                //获取用户信息
                let {
                    text
                } = await superagent.get('https://openapi.yiban.cn/user/me?access_token=' + access_token)
                let userInfo = JSON.parse(text).info
                /**
                 * 获取易班信息，注册用户，初始化密码
                 * 查询是否存在，不存在注册，存在则登陆这个页面，重定向
                 * 注册，返回token即可
                 */
                let res = await DBUser.findOne({
                    yb_userid: userInfo.yb_userid
                })
                if (!res) {
                    let insert = await new DBUser({
                        ...userInfo,
                        admin: 'student',
                        name: userInfo.yb_username,
                        sex: userInfo.yb_sex === 'M' ? '男' : "女",
                        password: '123456',
                        sid: 'yb' + userInfo.yb_userid
                    })
                    await insert.save()
                    res = await DBUser.findOne({
                        yb_userid: userInfo.yb_userid
                    })
                }
                const token = jwt.sign({
                    name: res.name,
                    sid: res.sid,
                    sex: res.sex,
                    college: res.college,
                    admin: res.admin,
                    local: res.local,
                    access_token
                }, secret, {
                    expiresIn: '24h'
                })
                ctx.response.redirect('http://hongguang.club:3004/#/home/worldmap?token=' + token)
            }
        } else {
            ctx.body = {
                status: '201',
                msg: '授权失败，不存在code',
            }
        }
    }
}

module.exports = new User()