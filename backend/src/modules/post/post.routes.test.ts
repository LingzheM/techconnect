import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '../../lib/prisma'
import app from '../../app'

// ── helpers ────────────────────────────────────────────────────────────────

const req = (path: string, init?: RequestInit) => app.request(path, init)

const postJson = (path: string, body: unknown, headers?: Record<string, string>) =>
  req(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })

const del = (path: string, headers?: Record<string, string>) =>
  req(path, { method: 'DELETE', headers })

const get = (path: string) => req(path)

// 注册并登录，返回 token
const registerAndLogin = async (suffix: string) => {
  const res = await postJson('/auth/register', {
    email: `${suffix}@example.com`,
    username: suffix,
    password: 'password123',
  })
  const { token } = await res.json()
  return token as string
}

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` })

// ── teardown ───────────────────────────────────────────────────────────────

beforeEach(async () => {
  await prisma.like.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.post.deleteMany()
  await prisma.follow.deleteMany()
  await prisma.user.deleteMany()
})

// ── POST /posts ─────────────────────────────────────────────────────────────

describe('POST /posts', () => {
  it('should return 401 when not logged in', async () => {
    const res = await postJson('/posts', { content: 'Hello' })
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBeDefined()
  })

  it('should return 400 when content is empty', async () => {
    const token = await registerAndLogin('user1')

    const res = await postJson('/posts', { content: '' }, bearer(token))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBeDefined()
  })

  it('should return 201 with post and author on success', async () => {
    const token = await registerAndLogin('user2')

    const res = await postJson('/posts', { content: 'Hello world' }, bearer(token))
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.content).toBe('Hello world')
    expect(body.author).toBeDefined()
    expect(body.author.username).toBe('user2')
    expect(body.author.password).toBeUndefined()
  })
})

// ── DELETE /posts/:id ───────────────────────────────────────────────────────

describe('DELETE /posts/:id', () => {
  it('should return 401 when not logged in', async () => {
    const res = await del('/posts/some-id')
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBeDefined()
  })

  it('should return 403 when a non-author tries to delete', async () => {
    const authorToken = await registerAndLogin('author1')
    const otherToken  = await registerAndLogin('other1')

    const createRes = await postJson('/posts', { content: 'Mine' }, bearer(authorToken))
    const { id } = await createRes.json()

    const res = await del(`/posts/${id}`, bearer(otherToken))
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.error).toBeDefined()
  })

  it('should return 200 when the author deletes their own post', async () => {
    const token = await registerAndLogin('author2')

    const createRes = await postJson('/posts', { content: 'To delete' }, bearer(token))
    const { id } = await createRes.json()

    const res = await del(`/posts/${id}`, bearer(token))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })
})

// ── GET /posts ──────────────────────────────────────────────────────────────

describe('GET /posts', () => {
  it('should return posts with hasMore and nextCursor', async () => {
    const token = await registerAndLogin('feeder1')
    await postJson('/posts', { content: 'Post A' }, bearer(token))
    await postJson('/posts', { content: 'Post B' }, bearer(token))

    const res = await get('/posts')
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(Array.isArray(body.posts)).toBe(true)
    expect(body.posts).toHaveLength(2)
    expect(body.hasMore).toBe(false)
    expect(body.nextCursor).toBeNull()
  })

  it('should respect the limit query parameter', async () => {
    const token = await registerAndLogin('feeder2')
    for (let i = 1; i <= 4; i++) {
      await postJson('/posts', { content: `Post ${i}` }, bearer(token))
    }

    const res = await get('/posts?limit=2')
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.posts).toHaveLength(2)
    expect(body.hasMore).toBe(true)
    expect(typeof body.nextCursor).toBe('string')
  })
})
