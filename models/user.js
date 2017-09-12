const mongoose = require('mongoose');
const { Schema } = mongoose;
const { plugin } = require('../libs/database');

let settingsSchema = new Schema({
  email: String
})

let schema = new Schema({
  username: {
    type: String,
    require: true, // 必填
    unique: true   // 唯一性
  },
  password: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
    default: '使用者' // 預設值，當沒有填此欄位時，會以此值當預設者
  },
  settings: settingsSchema
});

// 在 schema 物件產生後，使用 plugin 函數來新增 plugin
schema.plugin(plugin);

module.exports.User = mongoose.model('User', schema);