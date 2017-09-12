### **STEP 1** 建立應用架構
---

``` xml

- libs
------ database.js  <!-- 資料庫的初始化 -->
- models
------ user.js      <!-- 使用者的 model  -->
------ post.js      <!-- 文章的 model -->
------ comment.js   <!-- 回覆的 model -->
- package.json      <!-- 管理 npm 套件 -->
- server.js         <!-- 設定應用程式 -->

```

### **STEP2** 取代原生的 promise
---

``` javascript
// server.js
 
// 用 bluebird 替換掉 Nodejs 的 promise，因效能較好
global.Promise = require('bluebird');
```

### **STEP3** 資料庫連線設定

``` javascript
// database.js

const mongoose = require('mongoose');

// 新版的 mongoose 需要指定 Promise
mongoose.Promise = Promise;

module.exports.connect = () => {
  return new Promise((resolve, reject) => {

    let url = process.env.MONGODB_URI || 'mongodb://localhost/mongoose-playground';
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
```

### **STEP4** 設定 Model

``` javascript
const mongoose = require('mongoose');
const { Schema } = mongoose;

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

module.exports.User = mongoose.model('User', schema);
```

以下有使用到「 關聯其它表格」的方式，==type== 要填  ==Schema.Types.ObjectId==，==ref== 為 =='User'==

```javascript
const mongoose = require('mongoose');
const { Schema } = mongoose;

let schema = new Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    default: '(沒有內容)'
  },
  user: {
    type: Schema.Types.ObjectId, // 關聯另外一個 schema
    ref: 'User'  				 // 參考 'User' 這張表
  }
});

module.exports.Post = mongoose.model('Post', schema);
```

### **STEP5** 新增 User 和 Post
---

首先，根據 ==username== 和 ==password== 試著在資料庫 User 中找使用者，若沒有的話會在資料庫中建立。建立完成後，接著新增一筆關聯此使用者的 Post 資料

``` javascript
// server.js

// 用 bluebird 替換掉 Nodejs 的 promise，因效能較好
global.Promise = require('bluebird');

const database = require('./libs/database');
const { User } = require('./models/user');
const { Post } = require('./models/post');

(async () => {
  try {
    await database.connect();

    let username = 'jackyou';
    let password = '12345678';
    let displayName = '小飛';

    let user = await User.findOne({ username, password });

    if (!user) user = await User.create({ username, password, displayName });

	// 新增關聯 user 的 Post 資料
    let title = 'title';
    let content = '今天不用上班啦'; 
    let post = await Post.create({ title, content, user })
    await Post.create({ title, content, user })
 
 } catch (e) {
    console.log(e);
  }

})()
```

如下，當查尋 ==Post== collections 時，所回傳的 ==posts== 中的任一項，會發現 ==user== 的值是一個 ==ObjectID==，並沒有多帶資訊。

``` javascript
  let posts =  await Post.find()

  // 回傳的值
  [{
	_id: ObjectID
	content: "今天不用睡覺啦啦啦啦"
	errors: undefined
	id: "59b636d1dd3061676891153e"
	isNew: false
	title: "FF XV 上市啦"
	user: ObjectID
  }...]
```

若要得到 user 更多的資訊，可在 ==find== 之後加上 ==populate==，並且傳入要遞迴查尋的欄位 。可以發現此時 ==user== 欄位的值是一個 ==model==。 

``` javascript
let posts = await Post.find().populate('user');

  [{
	_id:ObjectID
	content:"今天不用睡覺啦啦啦啦"
	errors:undefined
	id:"59b636d1dd3061676891153e"
	isNew:false
	title:"FF XV 上市啦"
	user:model
  }...]

```


### **STEP6** 為 model 新增 plugin
----

``` javascript
// database.js

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
```

在每一個 model 中設定 plugin

``` javascript
let schema = new Schema({
	...
});
// 在 schema 物件產生後，使用 plugin 函數來新增 plugin
schema.plugin(plugin);
```
在進行 save 動作時，會觸發 ==schema.pre== 裡回呼函數，會去更新 updated 的欄位。

``` javascript
await user.save()
```
