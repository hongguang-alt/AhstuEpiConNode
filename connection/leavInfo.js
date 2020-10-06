const mongoose = require('mongoose')

const courseSchema = new mongoose.Schema({
    leavetype: String,
    leaveiphone: String,
    leavereason: String,
    date: Array,
    status: Number
})

module.exports = mongoose.model('LeaveInfos', courseSchema);