# MVP

登录 → Feed 页面 → 无限滚动 → 点赞

可以参考的顺序
```
⏳ api/ 层（client + auth + posts + likes）
⏳ LoginPage / RegisterPage
⏳ FeedPage + PostCard + LikeButton
⏳ useInfiniteScroll hook
⏳ ProfilePage（放到最后）
```



## LoginPage

模式：表单输入 → API调用 → store更新 → 路由跳转。

### 测试（行为描述）

1. 渲染： 页面包含email输入框，password输入框，提交按钮

2. 表单交互 → 成功：

- 填写Email和password，点击提交
- 期望：调用login(email, password)
- 期望：成功调用authStore.setAuth(token, user)
- 期望：导航到`/`

3. 加载状态：

- 请求`in-flight`时，提交按钮变为disabled或显示loading文字
- 防止重复提交

4. 失败 → 显示错误：

- API返回错误（401）
- 期望：页面显示错误
- 期望：停留在当前页，不跳转

5. 跳转到注册页：

- 点击“注册”连接，导航到`/register`

### 实现

- 状态：`email`, `password`, `isLoading`, `error`
- `handleSubmit`:

    1. 阻止默认行为
    2. 设置`isLoading = true`
    3. 调用`login(email, password)`
    4. 成功 → `setAuth(token, user)` → `navigate('/')`
    5. 失败 → 设`error = err.message` 清`isLoading`

### 测试mock

- `/api/auth`的`login`函数（`vi.mock`）
- `react-router-dom`的`useNavigate`（或者用`MemoryRouter`包裹）
- `authStore`用`useLikeStore.setState`