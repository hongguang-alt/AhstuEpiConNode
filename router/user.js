const Router = require('koa-router')
const router = Router()
const User = require('../controller/user')

//登陆接口
router.post('/login', User.login)

//套取天性数据的接口
router.get('/worldmap', User.worldMap)

//获取安科的确诊数据
router.get('/ankemap', User.ankeMap)


//修改安科确诊数据
router.put('/ankemapmanage', User.ankeMapManage)


//获取医院列表的数据
router.get('/vacfind', User.vacFind)

//判断邮件是否存在
router.get('/hasemail', User.hasEmail)

//绑定邮箱
router.post('/bindemail', User.bindEmail)

//显示绑定邮箱人员
router.get('/showemail', User.showEmail)

//解除绑定邮箱
router.delete('/untiemail', User.untieEmail)

//请假接口
router.post('/leave', User.leave)

//假期状态的接口
router.get('/leavestatus', User.leaveStatus)


//获取审批列表
router.get('/approval', User.approInfo)


//同意审批列表
router.put('/argeeappro', User.argeeAppro)

//销假
router.delete('/deleteagree/:sid', User.deleteAgree)

//个人信息
router.get('/personinfo', User.personInfo)


module.exports = router