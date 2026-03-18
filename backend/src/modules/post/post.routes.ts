import { Hono } from 'hono'
import z from 'zod'
import { authMiddleware, optionalAuthMiddleware, AuthVariables, OptionalAuthVariables } from '../../middleware/auth.middleware'
import { PostService } from './post.service'

const createPostSchema = z.object({
  content: z.string().min(1).max(500),
})

const app = new Hono<{ Variables: AuthVariables }>()
const publicApp = new Hono<{ Variables: OptionalAuthVariables }>()

app.post('/', authMiddleware, async (c) => {
  const result = createPostSchema.safeParse(await c.req.json())
  if (!result.success) {
    return c.json({ error: z.flattenError(result.error).fieldErrors }, 400)
  }

  try {
    const post = await PostService.create({ authorId: c.get('userId'), content: result.data.content })
    return c.json(post, 201)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create post'
    return c.json({ error: message }, 400)
  }
})

app.delete('/:id', authMiddleware, async (c) => {
  const postId = c.req.param('id')

  try {
    await PostService.delete({ postId, requesterId: c.get('userId') })
    return c.json({ success: true }, 200)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete post'
    const status = message === 'Forbidden' ? 403 : message === 'Post not found' ? 404 : 500
    return c.json({ error: message }, status)
  }
})

publicApp.get('/', optionalAuthMiddleware, async (c) => {
  const limit = Math.min(Number(c.req.query('limit') ?? 10), 50)
  const cursor = c.req.query('cursor') ?? null
  const feed = c.req.query('feed')
  const userId = c.get('userId')

  if (feed === 'following') {
    if (!userId) return c.json({ error: 'Unauthorized' }, 401)
    const result = await PostService.getFollowingFeed({ userId, limit, cursor })
    return c.json(result)
  }

  const result = await PostService.getFeed({ limit, cursor })
  return c.json(result)
})


app.route('/', publicApp)
export default app
