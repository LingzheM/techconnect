import { create } from 'zustand'
import { toggleLike } from '../api/likes'
import type { Post } from '../api/posts'

type LikeEntry = { like: boolean; likeCount: number }

type LikeState = {
  likes: Record<string, LikeEntry>
  initLikes: (posts: Post[]) => void
  toggle: (postId: string) => Promise<void>
}

export const useLikeStore = create<LikeState>((set, get) => ({
  likes: {},

  initLikes: (posts) => {
    const incoming = Object.fromEntries(
      posts.map(p => [p.id, { like: false, likeCount: p.likeCount }])
    )
    set(state => ({ likes: { ...incoming, ...state.likes } }))
  },

  toggle: async (postId) => {
    const prev = get().likes[postId]
    if (!prev) return

    // 1. 乐观更新
    set(state => ({
      likes: {
        ...state.likes,
        [postId]: { like: !prev.like, likeCount: prev.likeCount + (prev.like ? -1 : 1) },
      },
    }))

    try {
      // 2. 发请求，用服务端返回值覆盖（likeCount 以服务端为准）
      const result = await toggleLike(postId)
      set(state => ({
        likes: {
          ...state.likes,
          [postId]: { like: result.liked, likeCount: result.likeCount },
        },
      }))
    } catch {
      // 3. 失败回滚
      set(state => ({ likes: { ...state.likes, [postId]: prev } }))
    }
  },
}))
