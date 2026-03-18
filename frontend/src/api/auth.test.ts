import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../test/server'
import { register, login } from './auth'

const BASE = 'http://localhost:3000'

describe('auth.register', () => {
  it('should POST /auth/register and return token + user', async () => {
    server.use(
      http.post(`${BASE}/auth/register`, () =>
        HttpResponse.json(
          { token: 'abc123', user: { id: '1', username: 'alice', email: 'alice@example.com' } },
          { status: 201 },
        ),
      ),
    )

    const result = await register({ email: 'alice@example.com', username: 'alice', password: 'pw' })

    expect(result.token).toBe('abc123')
    expect(result.user.username).toBe('alice')
  })

  it('should throw when server returns 409', async () => {
    server.use(
      http.post(`${BASE}/auth/register`, () =>
        HttpResponse.json({ error: 'Email already in use' }, { status: 409 }),
      ),
    )

    await expect(
      register({ email: 'dup@example.com', username: 'dup', password: 'pw' }),
    ).rejects.toThrow()
  })
})

describe('auth.login', () => {
  it('should POST /auth/login and return token + user', async () => {
    server.use(
      http.post(`${BASE}/auth/login`, () =>
        HttpResponse.json({ token: 'tok456', user: { id: '2', username: 'bob', email: 'bob@example.com' } }),
      ),
    )

    const result = await login({ email: 'bob@example.com', password: 'pw' })

    expect(result.token).toBe('tok456')
    expect(result.user.username).toBe('bob')
  })

  it('should throw when server returns 401', async () => {
    server.use(
      http.post(`${BASE}/auth/login`, () =>
        HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 }),
      ),
    )

    await expect(
      login({ email: 'x@example.com', password: 'wrong' }),
    ).rejects.toThrow()
  })
})
