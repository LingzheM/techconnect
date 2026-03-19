import { describe, it, expect, beforeEach, vi, expectTypeOf } from "vitest";
import { useFeedStore } from './feedStore'
import * as postApi from '../api/posts'

vi.mock('../api/posts')

const mockPost = (id: string) => ({
    id,
    content: `Post ${id}`,
    likeCount: 0,
    createdAt: new Date().toISOString(),
    author: { id: 'u1', username: 'alice', avatarUrl: null },
})

const p1 = mockPost('p1')
const p2 = mockPost('p2')

beforeEach(() => {
    vi.clearAllMocks()
    useFeedStore.setState({ posts: [], hasMore: false, cursor: null, isLoading: false })
})

describe('feedStore - initial state', () => {
    it('should have empty posts, hasMore=flase, cursor=null, isLoading=false', () => {
      const { posts, hasMore, cursor, isLoading } = useFeedStore.getState()
      expect(posts).toEqual([]) 
      expect(hasMore).toBe(false)
      expect(cursor).toBeNull()
      expect(isLoading).toBe(false)
    })
})

// ---loadFeed---

describe(`feedStore - loadFeed`, () => {
    it('should set isLoading=true while the request is in-flight', async () => {
        let settle!: (v: Awaited<ReturnType<typeof postApi.getFeed>>) => void
        vi.mocked(postApi.getFeed).mockReturnValueOnce(new Promise(r => { settle = r }))

        const promise = useFeedStore.getState().loadFeed()
        expect(useFeedStore.getState().isLoading).toBe(true)

        settle({ posts: [], hasMore: false, nextCursor: null })
        await promise
        expect(useFeedStore.getState().isLoading).toBe(false)
    })

    it('should populate posts and set pagination state', async () => {
        vi.mocked(postApi.getFeed).mockResolvedValueOnce({
            posts: [p1, p2], hasMore: true, nextCursor: 'cur1',
        })

        await useFeedStore.getState().loadFeed()

        const { posts, hasMore, cursor } = useFeedStore.getState()
        expect(posts).toHaveLength(2)
        expect(hasMore).toBe(true)
        expect(cursor).toBe('cur1')
    })

    it('should clear existing posts and reset cursor when reset=true', async () => {
        useFeedStore.setState({ posts: [p1, p2], cursor: 'old', hasMore: true })
        vi.mocked(postApi.getFeed).mockResolvedValueOnce({
            posts: [p1], hasMore: false, nextCursor: null,
        })

        await useFeedStore.getState().loadFeed(true)

        expect(useFeedStore.getState().posts).toHaveLength(1)
        expect(useFeedStore.getState().cursor).toBeNull()
    })

    it('should call getFeed with cursor=null on reset', async () => {
        useFeedStore.setState({ cursor: 'stale-cursor' })
        vi.mocked(postApi.getFeed).mockResolvedValueOnce({
            posts: [], hasMore: false, nextCursor: null
        })

        await useFeedStore.getState().loadFeed(true)

        expect(postApi.getFeed).toHaveBeenCalledWith({ cursor: null })
    })
})

// ---loadMore---
describe('feedStore - loadMore', () => {
    it('should append posts to existing list', async () => {
        useFeedStore.setState({ posts: [p1], cursor: 'cur1', hasMore: true })
        vi.mocked(postApi.getFeed).mockResolvedValueOnce({
            posts: [p2], hasMore: false, nextCursor: null,
        })

        await useFeedStore.getState().loadMore()

        expect(useFeedStore.getState().posts).toEqual([p1, p2])
    })

    it('should call getFeed with the current cursor', async () => {
        useFeedStore.setState({ cursor: 'cur-xyz', hasMore: true })
        vi.mocked(postApi.getFeed).mockRejectedValueOnce({
            posts: [], hasMore: false, nextCursor: null,
        })

        await useFeedStore.getState().loadMore()

        expect(postApi.getFeed).toHaveBeenCalledWith({ cursor: 'cur-xyz' })
    })

    it('should do nothing when hasMore=false', async () => {
        useFeedStore.setState({ hasMore: false })

        await useFeedStore.getState().loadMore()

        expect(postApi.getFeed).not.toHaveBeenCalled()
    })

    it('should do nothing when already loading', async () => {
        useFeedStore.setState({ hasMore: true, isLoading: true})

        await useFeedStore.getState().loadMore()

        expect(postApi.getFeed).not.toHaveBeenCalled()
    })
})