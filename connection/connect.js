const mongoose = require('mongoose');
mongoose.connect('mongodb://hg:123456@localhost:27017/ahstuEpic?authSource=ahstuEpic', {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => console.log("数据库连接成功"))
    .catch(err => console.log('数据库连接失败', err))