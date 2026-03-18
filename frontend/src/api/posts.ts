import { client } from './client'

export type PostAuthor = { id: string; username: string; avatarUrl: string | null }
export type Post = {
  id: string
  content: string
  likeCount: number
  createdAt: string
  author: PostAuthor
}
export type FeedResult = { posts: Post[]; hasMore: boolean; nextCursor: string | null }

type FeedParams = { limit?: number; cursor?: string | null }

export const getFeed = async ({ limit, cursor }: FeedParams): Promise<FeedResult> => {
  const res = await client.get<FeedResult>('/posts', {
    params: { ...(limit ? { limit } : {}), ...(cursor ? { cursor } : {}) },
  })
  return res.data
}

export const getFollowingFeed = async ({ limit, cursor }: FeedParams): Promise<FeedResult> => {
  const res = await client.get<FeedResult>('/posts', {
    params: { feed: 'following', ...(limit ? { limit } : {}), ...(cursor ? { cursor } : {}) },
  })
  return res.data
}

export const createPost = async (content: string): Promise<Post> => {
  const res = await client.post<Post>('/posts', { content })
  return res.data
}

export const deletePost = async (postId: string): Promise<void> => {
  await client.delete(`/posts/${postId}`)
}
