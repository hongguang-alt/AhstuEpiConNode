const DBUser = require('../connection/user')
const DBULeaveInfo = require('../connection/leavInfo')
const DBCollege = require('../connection/college')
const jwt = require('jsonwebtoken')
const {
    secret
} = require('../config')
//缓存数据
const dataList = require('../cacheData/dataList.json')
const cityHosDataList = require('../cacheData/cityHosDataList.js')



class User {
    //登陆
    async login(ctx) {
        let {
            user: sid,
            password
        } = await ctx.request.body
        let res = await DBUser.findOne({
            sid
        })
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
    //套取疫情图
    async worldMap(ctx) {
        ctx.body = {
            status: '200',
            msg: '获取成功',
            data: dataList
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


    async showEmail(ctx) {
        let res = await DBUser.find()
        ctx.body = {
            status: "200",
            msg: '获取成功',
            data: {
                email: res.email,
                name: res.name,
                college: res.college,
                sid: res.sid
            }
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
}

module.exports = new User()