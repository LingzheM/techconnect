import { describe, it, expect, beforeEach, vi } from "vitest";
import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../test/server";
import { useLikeStore } from "../stores/likeStore";
import { useFeedStore } from "../stores/feedStore";
import { useAuthStore } from "../stores/authStore";
import * as likesApi from '../api/likes'
import { PostCard } from './PostCard'

vi.mock('../api/likes')

const mockPost = {
    id: 'p1',
    content: 'Hello world',
    likeCount: 3,
    createdAt: '2026-03-01T00:00:00Z',
    author: { id: 'author-1', username: 'alice', avatarUrl: null },
}

beforeEach(() => {
    vi.clearAllMocks()
    useLikeStore.setState({ likes: { p1: { like: false, likeCount: 3 }} })
    useFeedStore.setState({ posts: [mockPost], hasMore: false, cursor: null, isLoading: false })
    useAuthStore.setState({ token: null, user: null })
})

describe('PostCard - render', () => {
    it('should display the author username', () => {
        render(<PostCard post={mockPost}/>)
        expect(screen.getByText('alice')).toBeInTheDocument()
    })

    it('should display the post content', () => {
        render(<PostCard post={mockPost}/>)
        expect(screen.getByText('Hello world')).toBeInTheDocument()
    })

    it('should display the like count from likeStore', () => {
        render(<PostCard post={mockPost}/>)
        expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should show unfilled like button when not liked', () => {
        render(<PostCard post={mockPost}/>)
        expect(screen.getByRole('button', { name: /like/i })).toHaveAttribute('data-liked', 'false')
    })
})

describe('PostCard - like', () => {
    it('should call likeStore.toggle when like button is clicked', async () => {
        const toggle = vi.fn()
        useLikeStore.setState({ likes: { p1: {like: false, likeCount: 3}}, toggle })

        const user = userEvent.setup()
        render(<PostCard post={mockPost}/>)
        await user.click(screen.getByRole('button', { name: /like/i }))

        expect(toggle).toHaveBeenCalledWith('p1')
    })
    
})

describe('PostCard - delete button visibility', () => {
    it('should NOT show delete button when user is not logged in', () => {
        render(<PostCard post={mockPost}/>)
        expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
    })

    it('should NOT show delete button when logged-in user is not the author', () => {
        useAuthStore.setState({ token: 'tok', user: { id: 'other-user', username: 'bob', email: 'bob@example.com' } })
        render(<PostCard post={mockPost}/>)
        expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
    })

    it('should show delete button when logged-in user is the author', () => {
        useAuthStore.setState({ token: 'tok', user: { id: 'author-1', username: 'alice', email: 'alice@example.com' } })
        render(<PostCard post={mockPost}/>)
        expect(screen.queryByRole('button', { name: /delete/i })).toBeInTheDocument()

    })
})

describe('PostCard - delete', () => {
    beforeEach(() => {
        useAuthStore.setState({ token: 'tok', user: { id: 'author-1', username: 'alice', email: 'alice@example.com' } })
    })

    it('should call deletePost API and remove post from feedStore on success', async () => {
        server.use(http.delete('*/posts/p1', () => HttpResponse.json({ success: true })))

        const user = userEvent.setup()
        render(<PostCard post={mockPost}/>)
        await user.click(screen.getByRole('button', { name: /delete/i }))

        await waitFor(() => {
            expect(useFeedStore.getState().posts).toHaveLength(0)
        })
    })

    it('should disable delete button while request is in-flight', async () => {
        let settle!: () => void
        server.use(
        http.delete('*/posts/p1', () =>
            new Promise(resolve => { settle = () => resolve(HttpResponse.json({ success: true })) })
        )
        )

        const user = userEvent.setup()
        render(<PostCard post={mockPost} />)
        await user.click(screen.getByRole('button', { name: /delete/i }))

        expect(screen.getByRole('button', { name: /delete/i })).toBeDisabled()

        settle()
        await waitFor(() =>
        expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
        )
    })
})