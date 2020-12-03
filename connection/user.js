const mongoose = require('mongoose')

const courseSchema = new mongoose.Schema({
    sid: String,
    name: String,
    sex: String,
    college: String,
    admin: String,
    email: String,
    password: {
        type: String,
        select: false
    },
    emailTime: String,
    //存入假条的下划线id就行了，一一对应的关系
    leaveInfo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LeaveInfos'
    },
    //易班注册的用户
    yb_userid: String
})

module.exports = mongoose.model('Users', courseSchema);