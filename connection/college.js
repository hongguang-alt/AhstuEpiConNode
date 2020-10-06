const mongoose = require('mongoose')

const courseSchema = new mongoose.Schema({
    college: String,
    student: Number,
    other: Number,
    teacher: Number
})

module.exports = mongoose.model('Colleges', courseSchema);