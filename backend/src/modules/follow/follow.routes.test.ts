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

const get = (path: string) => app.request(path)

const registerAndLogin = async (suffix: string) => {
  const res = await postJson('/auth/register', {
    email: `${suffix}@example.com`,
    username: suffix,
    password: 'password123',
  })
  const { token, user } = await res.json()
  return { token: token as string, userId: user.id as string }
}

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` })

const toggleFollow = (targetId: string, headers?: Record<string, string>) =>
  app.request(`/users/${targetId}/follow`, { method: 'POST', headers })

// ── teardown ───────────────────────────────────────────────────────────────

beforeEach(async () => {
  await prisma.like.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.post.deleteMany()
  await prisma.follow.deleteMany()
  await prisma.user.deleteMany()
})

// ── POST /users/:id/follow ──────────────────────────────────────────────────

describe('POST /users/:id/follow', () => {
  it('should return 401 when not logged in', async () => {
    const { userId } = await registerAndLogin('target1')

    const res = await toggleFollow(userId)
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBeDefined()
  })

  it('should return 400 when trying to follow yourself', async () => {
    const { token, userId } = await registerAndLogin('self1')

    const res = await toggleFollow(userId, bearer(token))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBeDefined()
  })

  it('should return 404 when target user does not exist', async () => {
    const { token } = await registerAndLogin('follower1')

    const res = await toggleFollow('non-existent-id', bearer(token))
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error).toBeDefined()
  })

  it('should return following=true on first toggle', async () => {
    const { token }  = await registerAndLogin('follower2')
    const { userId } = await registerAndLogin('target2')

    const res = await toggleFollow(userId, bearer(token))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.following).toBe(true)
  })

  it('should return following=false on second toggle (unfollow)', async () => {
    const { token }  = await registerAndLogin('follower3')
    const { userId } = await registerAndLogin('target3')

    await toggleFollow(userId, bearer(token))
    const res = await toggleFollow(userId, bearer(token))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.following).toBe(false)
  })
})

// ── GET /users/:id/profile ──────────────────────────────────────────────────

describe('GET /users/:id/profile', () => {
  it('should return 404 when user does not exist', async () => {
    const res = await get('/users/non-existent-id/profile')
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error).toBeDefined()
  })

  it('should return user profile with counts', async () => {
    const { token: followerToken } = await registerAndLogin('follower4')
    const { userId }               = await registerAndLogin('target4')

    await toggleFollow(userId, bearer(followerToken))

    const res = await get(`/users/${userId}/profile`)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.username).toBe('target4')
    expect(body.followerCount).toBe(1)
    expect(body.followingCount).toBe(0)
    expect(body.postCount).toBe(0)
    expect(body.password).toBeUndefined()
  })
})
