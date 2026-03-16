import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '../../lib/prisma'
import { LikeService } from './like.service'

// ── helpers ────────────────────────────────────────────────────────────────

const makeUser = (suffix: string) =>
  prisma.user.create({
    data: { email: `${suffix}@example.com`, username: suffix, password: 'hashed' },
  })

const makePost = (authorId: string) =>
  prisma.post.create({
    data: { authorId, content: 'Test post' },
  })

const getPostLikeCount = (postId: string) =>
  prisma.post.findUniqueOrThrow({ where: { id: postId } }).then((p) => p.likeCount)

// ── teardown ───────────────────────────────────────────────────────────────

beforeEach(async () => {
  await prisma.like.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.post.deleteMany()
  await prisma.follow.deleteMany()
  await prisma.user.deleteMany()
})

// ── toggle ─────────────────────────────────────────────────────────────────

describe('LikeService.toggle', () => {
  it('should create a Like and return liked=true with likeCount=1 when not yet liked', async () => {
    const user = await makeUser('alice')
    const post = await makePost(user.id)

    const result = await LikeService.toggle({ userId: user.id, postId: post.id })

    expect(result.liked).toBe(true)
    expect(result.likeCount).toBe(1)
  })

  it('should delete the Like and return liked=false with likeCount=0 when already liked', async () => {
    const user = await makeUser('bob')
    const post = await makePost(user.id)

    await LikeService.toggle({ userId: user.id, postId: post.id })
    const result = await LikeService.toggle({ userId: user.id, postId: post.id })

    expect(result.liked).toBe(false)
    expect(result.likeCount).toBe(0)
  })

  it('should keep Post.likeCount in sync with the Like records in the database', async () => {
    const user = await makeUser('carol')
    const post = await makePost(user.id)

    await LikeService.toggle({ userId: user.id, postId: post.id })
    expect(await getPostLikeCount(post.id)).toBe(1)

    await LikeService.toggle({ userId: user.id, postId: post.id })
    expect(await getPostLikeCount(post.id)).toBe(0)
  })

  it('should handle multiple users liking the same post independently', async () => {
    const author = await makeUser('dave')
    const liker1 = await makeUser('eve')
    const liker2 = await makeUser('frank')
    const post    = await makePost(author.id)

    await LikeService.toggle({ userId: liker1.id, postId: post.id })
    const result = await LikeService.toggle({ userId: liker2.id, postId: post.id })

    expect(result.liked).toBe(true)
    expect(result.likeCount).toBe(2)
    expect(await getPostLikeCount(post.id)).toBe(2)
  })

  it('should not affect other posts likeCount when toggling', async () => {
    const user  = await makeUser('grace')
    const post1 = await makePost(user.id)
    const post2 = await makePost(user.id)

    await LikeService.toggle({ userId: user.id, postId: post1.id })

    expect(await getPostLikeCount(post1.id)).toBe(1)
    expect(await getPostLikeCount(post2.id)).toBe(0)
  })
})
