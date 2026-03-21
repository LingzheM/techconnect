import { Hono } from 'hono'
import { cors } from 'hono/cors'
import authRoutes from './modules/auth/auth.routes'
import postRoutes from './modules/post/post.routes'
import likeRoutes from './modules/like/like.routes'
import followRoutes from './modules/follow/follow.routes'

const app = new Hono()

app.use('*', cors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
}))

app.route('/auth', authRoutes)
app.route('/posts', postRoutes)
app.route('/posts', likeRoutes)
app.route('/users', followRoutes)

app.get('/health', (c) => c.json({ status: 'ok' }))

export default app