import { describe, it, expect, beforeEach, expectTypeOf } from 'vitest'
import { prisma } from '../../lib/prisma'
import { PostService } from './post.service'

// ── helpers ────────────────────────────────────────────────────────────────

const makeUser = (suffix: string) =>
  prisma.user.create({
    data: {
      email: `${suffix}@example.com`,
      username: suffix,
      password: 'hashed',
    },
  })

// ── teardown ───────────────────────────────────────────────────────────────

beforeEach(async () => {
  await prisma.like.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.post.deleteMany()
  await prisma.follow.deleteMany()
  await prisma.user.deleteMany()
})

// ── create ─────────────────────────────────────────────────────────────────

describe('PostService.create', () => {
  it('should create a post and return it with the author', async () => {
    const user = await makeUser('alice')

    const post = await PostService.create({
      authorId: user.id,
      content: 'Hello world',
    })

    expect(post.id).toBeDefined()
    expect(post.content).toBe('Hello world')
    expect(post.authorId).toBe(user.id)
    expect(post.author.username).toBe('alice')
  })

  it('should throw when content is empty', async () => {
    const user = await makeUser('bob')

    await expect(
      PostService.create({ authorId: user.id, content: '' })
    ).rejects.toThrow()
  })
})

// ── delete ─────────────────────────────────────────────────────────────────

describe('PostService.delete', () => {
  it('should allow the author to delete their own post', async () => {
    const user = await makeUser('carol')
    const post = await PostService.create({ authorId: user.id, content: 'To be deleted' })

    await expect(
      PostService.delete({ postId: post.id, requesterId: user.id })
    ).resolves.not.toThrow()

    const gone = await prisma.post.findUnique({ where: { id: post.id } })
    expect(gone).toBeNull()
  })

  it('should throw when a non-author tries to delete the post', async () => {
    const author = await makeUser('dave')
    const other  = await makeUser('eve')
    const post   = await PostService.create({ authorId: author.id, content: 'Mine' })

    await expect(
      PostService.delete({ postId: post.id, requesterId: other.id })
    ).rejects.toThrow()
  })
})

// ── getFeed ────────────────────────────────────────────────────────────────

describe('PostService.getFeed', () => {
  it('should return posts with hasMore=false and nextCursor=null when results fit in one page', async () => {
    const user = await makeUser('frank')
    await PostService.create({ authorId: user.id, content: 'Post 1' })
    await PostService.create({ authorId: user.id, content: 'Post 2' })

    const result = await PostService.getFeed({ limit: 10 })

    expect(result.posts).toHaveLength(2)
    expect(result.hasMore).toBe(false)
    expect(result.nextCursor).toBeNull()
  })

  it('should return hasMore=true and a valid nextCursor when there are more posts', async () => {
    const user = await makeUser('grace')
    for (let i = 1; i <= 6; i++) {
      await PostService.create({ authorId: user.id, content: `Post ${i}` })
    }

    const result = await PostService.getFeed({ limit: 5 })

    expect(result.posts).toHaveLength(5)
    expect(result.hasMore).toBe(true)
    expect(result.nextCursor).toBeDefined()
    expect(typeof result.nextCursor).toBe('string')
  })

  it('should return the next page correctly when cursor is provided', async () => {
    const user = await makeUser('henry')
    for (let i = 1; i <= 6; i++) {
      await PostService.create({ authorId: user.id, content: `Post ${i}` })
    }

    const first  = await PostService.getFeed({ limit: 5 })
    const second = await PostService.getFeed({ limit: 5, cursor: first.nextCursor! })

    expect(second.posts).toHaveLength(1)
    expect(second.hasMore).toBe(false)
    expect(second.nextCursor).toBeNull()

    // 两页合计不重复
    const allIds = [...first.posts, ...second.posts].map((p) => p.id)
    expect(new Set(allIds).size).toBe(6)
  })

  it('should return posts with author info attached', async () => {
    const user = await makeUser('iris')
    await PostService.create({ authorId: user.id, content: 'With author' })

    const { posts } = await PostService.getFeed({ limit: 10 })

    expect(posts[0].author).toBeDefined()
    expect(posts[0].author.username).toBe('iris')
    expect((posts[0].author as any).password).toBeUndefined()
  })
})

describe('PostService.getFollowingFeed', () => {
  it('should return only posts from followed users', async () => {
    const viewer = await makeUser('jack')
    const followed = await makeUser('kate')
    const stranger = await makeUser('leo')

    await prisma.follow.create({ data: {followerId: viewer.id, followingId: followed.id} })

    await PostService.create({ authorId: followed.id, content: 'From followed' })
    await PostService.create({ authorId: stranger.id, content: 'From stranger' })

    const { posts } = await PostService.getFollowingFeed({ userId: viewer.id, limit: 10 })
  

    expect(posts).toHaveLength(1)
    expect(posts[0].content).toBe('From followed')
  })

  it('should return empty when the user follows nobody', async () => {
    const viewer = await makeUser('mia')
    const other  = await makeUser('ned')
    await PostService.create({ authorId: other.id, content: 'Invisible' })

    const { posts, hasMore, nextCursor } = await PostService.getFollowingFeed({ userId: viewer.id, limit: 10 })

    expect(posts).toHaveLength(0)
    expect(hasMore).toBe(false)
    expect(nextCursor).toBeNull()
  })

  it('should support cursor-based pagination', async () => {
    const viewer   = await makeUser('olivia')
    const followed = await makeUser('pete')

    await prisma.follow.create({ data: { followerId: viewer.id, followingId: followed.id } })

    for (let i = 1; i <= 4; i++) {
      await PostService.create({ authorId: followed.id, content: `Post ${i}` })
    }

    const first  = await PostService.getFollowingFeed({ userId: viewer.id, limit: 3 })
    const second = await PostService.getFollowingFeed({ userId: viewer.id, limit: 3, cursor: first.nextCursor! })

    expect(first.posts).toHaveLength(3)
    expect(first.hasMore).toBe(true)
    expect(second.posts).toHaveLength(1)
    expect(second.hasMore).toBe(false)

    const allIds = [...first.posts, ...second.posts].map((p) => p.id)
    expect(new Set(allIds).size).toBe(4)
  })
})