import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '../../lib/prisma'
import app from '../../app'

// ── helpers ────────────────────────────────────────────────────────────────

const postJson = (path: string, body: unknown, headers?: Record<string, string>) =>
  app.request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })

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

const createPost = async (token: string) => {
  const res = await postJson('/posts', { content: 'A post to like' }, bearer(token))
  const body = await res.json()
  return body.id as string
}

const toggleLike = (postId: string, headers?: Record<string, string>) =>
  app.request(`/posts/${postId}/like`, { method: 'POST', headers })

// ── teardown ───────────────────────────────────────────────────────────────

beforeEach(async () => {
  await prisma.like.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.post.deleteMany()
  await prisma.follow.deleteMany()
  await prisma.user.deleteMany()
})

// ── POST /posts/:id/like ────────────────────────────────────────────────────

describe('POST /posts/:id/like', () => {
  it('should return 401 when not logged in', async () => {
    const token = await registerAndLogin('owner1')
    const postId = await createPost(token)

    const res = await toggleLike(postId)
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBeDefined()
  })

  it('should return liked=true and likeCount=1 on first toggle', async () => {
    const token = await registerAndLogin('user1')
    const postId = await createPost(token)

    const res = await toggleLike(postId, bearer(token))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.liked).toBe(true)
    expect(body.likeCount).toBe(1)
  })

  it('should return liked=false and likeCount=0 on second toggle', async () => {
    const token = await registerAndLogin('user2')
    const postId = await createPost(token)

    await toggleLike(postId, bearer(token))

    const res = await toggleLike(postId, bearer(token))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.liked).toBe(false)
    expect(body.likeCount).toBe(0)
  })

  it('should return 404 when post does not exist', async () => {
    const token = await registerAndLogin('user3')

    const res = await toggleLike('non-existent-id', bearer(token))
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error).toBeDefined()
  })
})
