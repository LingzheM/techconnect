// 1. 渲染feedstore中所有post通过postcard
// 2. 显示loading状态
// 3. hasMore=false 时显示 no more posts
// 4. sentinel进入时调用loadMore
// 5. isLoading = true时不重复触发 loadMore

import { describe, it, expect, beforeEach, vi } from "vitest";
import '@testing-library/jest-dom'
import { render, screen, act } from "@testing-library/react";
import { useFeedStore } from "../stores/feedStore";
import { useLikeStore } from "../stores/likeStore";
import { FeedPage } from './FeedPage'

let triggerIntersect: () => void

vi.mock('../hooks/useInfiniteScroll', () => ({
    useInfiniteScroll: vi.fn((cb: () => void) => {
        triggerIntersect = cb
        return vi.fn()
    }),
}))

const makePosts = (n: number) => 
    Array.from({ length: n }, (_, i) =>({
        id: `p${i}`,
        content: `Post ${i}`,
        likeCount: 0,
        createdAt: '2026-01-01T00:00:00Z',
        author: { id: 'u1', username: 'alice', avataUrl: null },
    }))

beforeEach(() => {
    useFeedStore.setState({ posts:[], hasMore: true, cursor: null, isLoading: false })
    useLikeStore.setState({ likes: {} })
})

describe('FeedPage', () => {
    it('should render a Postcard for each post in feedStore', () => {
        useFeedStore.setState({ posts: makePosts(3), hasMore: false, cursor: null, isLoading: false })
        useLikeStore.setState({ likes: { p0: { like: false, likeCount: 0 }, p1: { like: false, likeCount: 0 }, p2: { like: false, likeCount: 0 } } })
        render(<FeedPage />)
        expect(screen.getAllByText('alice')).toHaveLength(3)
    })

    it('should show loading indicator when isLoading is true', () => {
        useFeedStore.setState({ posts: [], hasMore: true, cursor: null, isLoading: true })
        render(<FeedPage />)
        expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('should show "no more posts" when hasMore is false', () => {
        useFeedStore.setState({ posts: [], hasMore: false, cursor: null, isLoading: false })
        render(<FeedPage />)
        expect(screen.getByText(/no more post/i)).toBeInTheDocument()
    })

    it('should call loadMore when sentinel enters the viewport', () => {
        const loadMore = vi.fn()
        useFeedStore.setState({ posts: makePosts(1), hasMore: true, cursor: null, isLoading: false, loadMore })
        useLikeStore.setState({ likes: { p0: { like: false, likeCount: 0 } } })
        render(<FeedPage />)
        act(() => triggerIntersect())
        expect(loadMore).toHaveBeenCalledOnce()
    })

    it('should NOT call loadMore when isLoading is true', () => {
        const loadMore = vi.fn()
        useFeedStore.setState({ posts: [], hasMore: true, cursor: null, isLoading: true, loadMore })
        render(<FeedPage />)
        act(() => triggerIntersect())
        expect(loadMore).not.toHaveBeenCalled()
    })

})