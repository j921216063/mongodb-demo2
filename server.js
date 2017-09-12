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
    console.log(user)
    
    // 新增關聯 user 的 Post 資料
    // let title = 'title';
    // let content = '今天不用上班啦'; 
    // await Post.create({ title, content, user })

    // 一般的查尋
    // let posts =  await Post.find();
    // console.log(posts);
    
    // 使用 populate 的方式
    // let posts = await Post.find().populate('user');
    // console.log(posts);

    // 在 save 動作之前，updated 的值會進行更新
    await user.save()
    console.log(user);
  } catch (e) {
    console.log(e);
  }

})()
