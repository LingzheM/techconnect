import { create } from 'zustand'
import { getFeed, type Post } from '../api/posts'

type FeedState = {
  posts: Post[]
  hasMore: boolean
  cursor: string | null
  isLoading: boolean
  loadFeed: (reset?: boolean) => Promise<void>
  loadMore: () => Promise<void>
}

export const useFeedStore = create<FeedState>((set, get) => ({
  posts: [],
  hasMore: false,
  cursor: null,
  isLoading: false,

  loadFeed: async (reset = true) => {
    const cursor = reset ? null : get().cursor

    set({ isLoading: true, ...(reset && { posts: [], cursor: null }) })

    try {
      const result = await getFeed({ cursor })
      set(state => ({
        posts: reset ? result.posts : [...state.posts, ...result.posts],
        hasMore: result.hasMore,
        cursor: result.nextCursor,
        isLoading: false,
      }))
    } catch {
      set({ isLoading: false })
    }
  },

  loadMore: async () => {
    const { hasMore, isLoading, cursor } = get()
    if (!hasMore || isLoading) return

    set({ isLoading: true })

    try {
      const result = await getFeed({ cursor })
      set(state => ({
        posts: [...state.posts, ...result.posts],
        hasMore: result.hasMore,
        cursor: result.nextCursor,
        isLoading: false,
      }))
    } catch {
      set({ isLoading: false })
    }
  },
}))
