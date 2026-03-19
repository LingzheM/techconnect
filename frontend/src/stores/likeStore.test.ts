import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useLikeStore } from './likeStore'
import * as likesApi from '../api/likes'

vi.mock('../api/likes')

const seedPost = (postId: string, liked = false, likeCount = 0) =>
  useLikeStore.setState({
    likes: { ...useLikeStore.getState().likes, [postId]: { like: liked, likeCount } },
  })

beforeEach(() => {
  vi.clearAllMocks()
  useLikeStore.setState({ likes: {} })
})

// ── initLikes ────────────────────────────────────────────────────────────────

describe('likeStore — initLikes', () => {
  it('should populate likes from a list of posts', () => {
    const posts = [
      { id: 'p1', likeCount: 3, content: '', createdAt: '', author: { id: 'u1', username: 'a', avatarUrl: null } },
      { id: 'p2', likeCount: 0, content: '', createdAt: '', author: { id: 'u1', username: 'a', avatarUrl: null } },
    ]

    useLikeStore.getState().initLikes(posts as any)

    const { likes } = useLikeStore.getState()
    expect(likes['p1']).toEqual({ like: false, likeCount: 3 })
    expect(likes['p2']).toEqual({ like: false, likeCount: 0 })
  })

  it('should merge with existing likes without clobbering other posts', () => {
    seedPost('existing', true, 5)

    useLikeStore.getState().initLikes([
      { id: 'p3', likeCount: 1, content: '', createdAt: '', author: { id: 'u1', username: 'a', avatarUrl: null } },
    ] as any)

    const { likes } = useLikeStore.getState()
    expect(likes['existing']).toEqual({ like: true, likeCount: 5 })
    expect(likes['p3']).toEqual({ like: false, likeCount: 1 })
  })
})

// ── toggle ────────────────────────────────────────────────────────────────────

describe('likeStore — toggle (optimistic update)', () => {
  it('should immediately flip liked and adjust likeCount before request resolves', async () => {
    seedPost('p1', false, 2)

    let settle!: (v: Awaited<ReturnType<typeof likesApi.toggleLike>>) => void
    vi.mocked(likesApi.toggleLike).mockReturnValueOnce(new Promise(r => { settle = r }))

    const promise = useLikeStore.getState().toggle('p1')

    expect(useLikeStore.getState().likes['p1']).toEqual({ like: true, likeCount: 3 })

    settle({ liked: true, likeCount: 3 })
    await promise
  })

  it('should update state with server response on success', async () => {
    seedPost('p1', false, 2)
    vi.mocked(likesApi.toggleLike).mockResolvedValueOnce({ liked: true, likeCount: 3 })

    await useLikeStore.getState().toggle('p1')

    expect(useLikeStore.getState().likes['p1']).toEqual({ like: true, likeCount: 3 })
  })

  it('should roll back to original state when request fails', async () => {
    seedPost('p1', false, 2)
    vi.mocked(likesApi.toggleLike).mockRejectedValueOnce(new Error('Network error'))

    await useLikeStore.getState().toggle('p1')

    expect(useLikeStore.getState().likes['p1']).toEqual({ like: false, likeCount: 2 })
  })

  it('should toggle from liked to unliked optimistically', async () => {
    seedPost('p1', true, 5)
    vi.mocked(likesApi.toggleLike).mockResolvedValueOnce({ liked: false, likeCount: 4 })

    await useLikeStore.getState().toggle('p1')

    expect(useLikeStore.getState().likes['p1']).toEqual({ like: false, likeCount: 4 })
  })

  it('should not affect other posts when toggling', async () => {
    seedPost('p1', false, 1)
    seedPost('p2', true, 9)
    vi.mocked(likesApi.toggleLike).mockResolvedValueOnce({ liked: true, likeCount: 2 })

    await useLikeStore.getState().toggle('p1')

    expect(useLikeStore.getState().likes['p2']).toEqual({ like: true, likeCount: 9 })
  })
})
