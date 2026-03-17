import { Hono } from 'hono'
import { authMiddleware, AuthVariables } from '../../middleware/auth.middleware'
import { FollowService } from './follow.service'

const app = new Hono<{ Variables: AuthVariables }>()

app.post('/:id/follow', authMiddleware, async (c) => {
  const followingId = c.req.param('id')

  try {
    const result = await FollowService.toggle({ followerId: c.get('userId'), followingId })
    return c.json(result, 200)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to follow'
    if (message === 'Cannot follow yourself') return c.json({ error: message }, 400)
    if (message === 'User not found')         return c.json({ error: message }, 404)
    throw err
  }
})

app.get('/:id/profile', async (c) => {
  const userId = c.req.param('id')

  try {
    const profile = await FollowService.getProfile({ userId })
    return c.json(profile, 200)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get profile'
    if (message === 'User not found') return c.json({ error: message }, 404)
    throw err
  }
})

export default app
