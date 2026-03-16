import { prisma } from '../../lib/prisma'

const authorSelect = {
  id: true,
  username: true,
  avatarUrl: true,
}

type CreateInput = {
  authorId: string
  content: string
}

type DeleteInput = {
  postId: string
  requesterId: string
}

type GetFeedInput = {
  limit: number
  cursor?: string | null
}

export const PostService = {
  async create({ authorId, content }: CreateInput) {
    if (!content) throw new Error('Content is required')

    return prisma.post.create({
      data: { authorId, content },
      include: { author: { select: authorSelect } },
    })
  },

  async delete({ postId, requesterId }: DeleteInput) {
    const post = await prisma.post.findUnique({ where: { id: postId } })

    if (!post) throw new Error('Post not found')
    if (post.authorId !== requesterId) throw new Error('Forbidden')

    await prisma.post.delete({ where: { id: postId } })
  },

  async getFeed({ limit, cursor }: GetFeedInput) {
    const posts = await prisma.post.findMany({
      take: limit + 1,
      where: cursor ? { createdAt: { lt: new Date(cursor) } } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { author: { select: authorSelect } },
    })

    const hasMore = posts.length > limit
    const page = hasMore ? posts.slice(0, limit) : posts
    const nextCursor = hasMore ? page[page.length - 1].createdAt.toISOString() : null

    return { posts: page, hasMore, nextCursor }
  },
}
