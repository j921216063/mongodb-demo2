const mongoose = require('mongoose');

// 新版的 mongoose 需要指定 Promise
mongoose.Promise = Promise;

module.exports.connect = () => {
  return new Promise((resolve, reject) => {

    let url = process.env.MONGODB_URI || 'mongodb://localhost/mongoose-playground2';
    let conn = mongoose.connection;

    conn.on('error', reject);

    conn.once('open', () => { // 建議是用 once
      console.log('Mongoose default connection open to ' + url);
      resolve()
    });

    // When the connection is disconnected
    conn.on('disconnected', () => {
      console.log('Mongoose default connection disconnected');
    });

    // If the Node process ends, close the Mongoose connection
    process.on('SIGINT', () => {
      conn.close(() => {
        console.log('Mongoose default connection disconnected through app termination');
        process.exit(0);
      })
    });

    // 連線至資料庫
    mongoose.connect(url);
  })
}

// 每一個表格 collection 都會用到的東西，放在這邊集中處理 
module.exports.plugin = (schema) => {
  // 追加欄位
  schema.add({
    created: {
      type: Date,
      default: new Date()
    },
    updated: {
      type: Date,
      default: new Date()
    }
  });

  // 在做 save 這個動作之前，將 updated 改成新的日期
  schema.pre('save', function (next) {
    this.updated = new Date();
    next();
  })
}