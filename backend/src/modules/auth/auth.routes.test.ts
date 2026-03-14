import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '../../lib/prisma'
import app from '../../app'


const post = async (path: string, body: unknown) =>
    app.request(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })

beforeEach(async () => {
  await prisma.like.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.post.deleteMany()
  await prisma.follow.deleteMany()
  await prisma.user.deleteMany()
})

describe('POST /auth/register', () => {
  const validUser = {
    email: 'test@example.com',
    username: 'testuser',
    password: 'password123',
  }

  it('should register a new user and return 201 with token', async () => {
    const res = await post('/auth/register', validUser)
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.token).toBeDefined()
    expect(body.user.email).toBe(validUser.email)
    expect(body.user.password).toBeUndefined()
  })

  it('should return 400 if email is invalid', async () => {
    const res = await post('/auth/register', { ...validUser, email: 'not-an-email' })
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBeDefined()
  })

  it('should return 400 if password is too short', async () => {
    const res = await post('/auth/register', { ...validUser, password: '123' })
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBeDefined()
  })

  it('should return 409 if email already exists', async () => {
    await post('/auth/register', validUser)

    const res = await post('/auth/register', { ...validUser, username: 'differentuser' })
    const body = await res.json()

    expect(res.status).toBe(409)
    expect(body.error).toBeDefined()
  })
})

describe('POST /auth/login', () => {
  beforeEach(async () => {
    await post('/auth/register', {
      email: 'login@example.com',
      username: 'loginuser',
      password: 'password123',
    })
  })

  it('should return 200 with token on valid credentials', async () => {
    const res = await post('/auth/login', { email: 'login@example.com', password: 'password123' })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.token).toBeDefined()
    expect(body.user.password).toBeUndefined()
  })

  it('should return 401 on wrong password', async () => {
    const res = await post('/auth/login', { email: 'login@example.com', password: 'wrongpassword' })
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBeDefined()
  })

  it('should return 401 if user does not exist', async () => {
    const res = await post('/auth/login', { email: 'ghost@example.com', password: 'password123' })
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBeDefined()
  })
})
