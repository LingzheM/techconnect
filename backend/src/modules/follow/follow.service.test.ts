import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '../../lib/prisma'
import { FollowService } from './follow.service'

// ── helpers ────────────────────────────────────────────────────────────────

const makeUser = (suffix: string) =>
  prisma.user.create({
    data: { email: `${suffix}@example.com`, username: suffix, password: 'hashed' },
  })

// ── teardown ───────────────────────────────────────────────────────────────

beforeEach(async () => {
  await prisma.like.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.post.deleteMany()
  await prisma.follow.deleteMany()
  await prisma.user.deleteMany()
})

// ── toggle ─────────────────────────────────────────────────────────────────

describe('FollowService.toggle', () => {
  it('should create a Follow and return following=true when not yet following', async () => {
    const follower  = await makeUser('alice')
    const following = await makeUser('bob')

    const result = await FollowService.toggle({ followerId: follower.id, followingId: following.id })

    expect(result.following).toBe(true)
  })

  it('should delete the Follow and return following=false when already following', async () => {
    const follower  = await makeUser('carol')
    const following = await makeUser('dave')

    await FollowService.toggle({ followerId: follower.id, followingId: following.id })
    const result = await FollowService.toggle({ followerId: follower.id, followingId: following.id })

    expect(result.following).toBe(false)
  })

  it('should throw "Cannot follow yourself" when followerId === followingId', async () => {
    const user = await makeUser('eve')

    await expect(
      FollowService.toggle({ followerId: user.id, followingId: user.id })
    ).rejects.toThrow('Cannot follow yourself')
  })

  it('should throw "User not found" when target user does not exist', async () => {
    const follower = await makeUser('frank')

    await expect(
      FollowService.toggle({ followerId: follower.id, followingId: 'non-existent-id' })
    ).rejects.toThrow('User not found')
  })
})

// ── getProfile ─────────────────────────────────────────────────────────────

describe('FollowService.getProfile', () => {
  it('should return user info with followerCount, followingCount, and postCount', async () => {
    const user      = await makeUser('grace')
    const follower1 = await makeUser('henry')
    const follower2 = await makeUser('iris')

    await FollowService.toggle({ followerId: follower1.id, followingId: user.id })
    await FollowService.toggle({ followerId: follower2.id, followingId: user.id })
    await FollowService.toggle({ followerId: user.id, followingId: follower1.id })
    await prisma.post.create({ data: { authorId: user.id, content: 'Hello' } })

    const profile = await FollowService.getProfile({ userId: user.id })

    expect(profile.id).toBe(user.id)
    expect(profile.username).toBe('grace')
    expect(profile.followerCount).toBe(2)
    expect(profile.followingCount).toBe(1)
    expect(profile.postCount).toBe(1)
    expect((profile as any).password).toBeUndefined()
  })

  it('should throw "User not found" when user does not exist', async () => {
    await expect(
      FollowService.getProfile({ userId: 'non-existent-id' })
    ).rejects.toThrow('User not found')
  })
})
