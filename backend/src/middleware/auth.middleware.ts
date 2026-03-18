import { createMiddleware } from 'hono/factory'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET ?? 'fallback-secret'

export type AuthVariables = {
  userId: string
}

export type OptionalAuthVariables = {
  userId: string | undefined
}

export const authMiddleware = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.slice(7)

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string }
    c.set('userId', payload.userId)
  } catch {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  await next()
})

export const optionalAuthMiddleware = createMiddleware<{ Variables: OptionalAuthVariables }>(async (c, next) => {
  const authHeader = c.req.header('Authorization')

  if (authHeader?.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(authHeader.slice(7), JWT_SECRET) as { userId: string }
      c.set('userId', payload.userId)
    } catch {
      // invalid token → treat as unauthenticated
    }
  }

  await next()
})
