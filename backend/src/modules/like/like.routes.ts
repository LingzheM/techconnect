import { Hono } from 'hono'
import { authMiddleware, AuthVariables } from '../../middleware/auth.middleware'
import { LikeService } from './like.service'

const app = new Hono<{ Variables: AuthVariables }>()

app.post('/:id/like', authMiddleware, async (c) => {
  const postId = c.req.param('id')

  try {
    const result = await LikeService.toggle({ userId: c.get('userId'), postId })
    return c.json(result, 200)
  } catch (err: any) {
    if (err?.code === 'P2025' || err?.code === 'P2003') {
      return c.json({ error: 'Post not found' }, 404)
    }
    throw err
  }
})

export default app
