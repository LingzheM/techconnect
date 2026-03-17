import { prisma } from '../../lib/prisma'

type ToggleInput = {
  followerId: string
  followingId: string
}

type GetProfileInput = {
  userId: string
}

export const FollowService = {
  async toggle({ followerId, followingId }: ToggleInput) {
    if (followerId === followingId) throw new Error('Cannot follow yourself')

    const target = await prisma.user.findUnique({ where: { id: followingId } })
    if (!target) throw new Error('User not found')

    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    })

    if (existing) {
      await prisma.follow.delete({
        where: { followerId_followingId: { followerId, followingId } },
      })
      return { following: false }
    }

    await prisma.follow.create({ data: { followerId, followingId } })
    return { following: true }
  },

  async getProfile({ userId }: GetProfileInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
          },
        },
      },
    })

    if (!user) throw new Error('User not found')

    const { _count, ...rest } = user
    return {
      ...rest,
      followerCount: _count.followers,
      followingCount: _count.following,
      postCount: _count.posts,
    }
  },
}
