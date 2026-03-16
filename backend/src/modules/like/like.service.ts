import { prisma } from '../../lib/prisma'

type ToggleInput = {
  userId: string
  postId: string
}

export const LikeService = {
  async toggle({ userId, postId }: ToggleInput) {
    const existing = await prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    })

    if (existing) {
      const [, post] = await prisma.$transaction([
        prisma.like.delete({ where: { userId_postId: { userId, postId } } }),
        prisma.post.update({ where: { id: postId }, data: { likeCount: { decrement: 1 } } }),
      ])
      return { liked: false, likeCount: post.likeCount }
    }

    const [, post] = await prisma.$transaction([
      prisma.like.create({ data: { userId, postId } }),
      prisma.post.update({ where: { id: postId }, data: { likeCount: { increment: 1 } } }),
    ])
    return { liked: true, likeCount: post.likeCount }
  },
}
