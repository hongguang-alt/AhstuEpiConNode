const mongoose = require('mongoose')

const courseSchema = new mongoose.Schema({
    destination: String,
    risklevel: Number
})

module.exports = mongoose.model('destination', courseSchema);