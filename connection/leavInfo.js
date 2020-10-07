const mongoose = require('mongoose')

const courseSchema = new mongoose.Schema({
    leavetype: String,
    leaveiphone: String,
    leavereason: String,
    date: Array,
    status: Number,
    destination: String,
    risklevel: Number
})

module.exports = mongoose.model('LeaveInfos', courseSchema);