import { Hono } from 'hono'
import authRoutes from './modules/auth/auth.routes'
import postRoutes from './modules/post/post.routes'

const app = new Hono()

app.route('/auth', authRoutes)
app.route('/posts', postRoutes)

app.get('/health', (c) => c.json({ status: 'ok' }))

export default app