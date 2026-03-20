# 已完成

## 后端

✅ 注册/登录/JWT
✅ JWT middleware 
✅ POST 
✅ Feed流（广场流+关注流）
✅ 点赞toggle
✅ 关注/取关toggle
✅ 个人主页数据

## 前端

✅ api层（client/auth/posts/likes）
✅ authStore
✅ feedStore
✅ likeStore
✅ LoginPage/ReigsterPage

# 未完成

## 后端

⏯️ comment （优先度不高）
⏯️ 关键词搜索 `GET/posts?q=`

## 前端

⏯️ FeedPage+无限滚动 （P0优先级）
⏯️ PostCard组件（P0优先级）
⏯️ LikeButton更新（P0优先级）
⏯️ ProfilePage
⏯️ profileStore
⏯️ Tailwind样式/响应式
⏯️ 种子数据脚本
⏯️ Comment UI
⏯️ 搜索UI

# 验收

## 功能验收
```
1. 注册 → 登录 → 看到 Feed
2. 发一条动态 → 出现在 Feed 顶部
3. 滚动到底部 → 自动加载下一批（无限滚动）
4. 点赞 → UI 立即变化 → 刷新后数量正确
5. 关注一个用户 → 切换到关注流 → 只看到他的动态
6. 访问个人主页 → 显示粉丝数 / 关注数 / 动态数
```

## 工程验收
```
1. npm test → 全绿
2. push 到 GitHub → CI 通过（绿色 badge）
3. README 有本地启动步骤 + ER 图 + 技术选型说明
```

## 加分项
```
1. 能解释 cursor 分页 vs offset 的区别
2. 能解释 likeCount 冗余字段的理由
3. 能解释乐观更新的回滚逻辑
4. 测试覆盖率截图
```