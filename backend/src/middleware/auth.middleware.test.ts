import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import jwt from 'jsonwebtoken'
import { authMiddleware, AuthVariables } from './auth.middleware'

const JWT_SECRET = process.env.JWT_SECRET ?? 'fallback-secret'

// 构造一个只挂了 authMiddleware 的最小测试 app
const app = new Hono<{ Variables: AuthVariables }>()

app.get('/protected', authMiddleware, (c) => {
  return c.json({ userId: c.get('userId') })
})

const get = (headers?: Record<string, string>) =>
  app.request('/protected', { headers })

describe('authMiddleware', () => {
  it('should return 401 when Authorization header is missing', async () => {
    const res = await get()
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  it('should return 401 when token is invalid', async () => {
    const res = await get({ Authorization: 'Bearer this.is.not.a.valid.token' })
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  it('should call next and set userId when token is valid', async () => {
    const token = jwt.sign({ userId: 'user-123' }, JWT_SECRET)

    const res = await get({ Authorization: `Bearer ${token}` })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.userId).toBe('user-123')
  })
})
