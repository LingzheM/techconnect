import { describe, it, expect, beforeEach, vi } from "vitest";
import '@testing-library/jest-dom'
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useLikeStore } from "../stores/likeStore";
import { LikeButton } from './LikeButton'

beforeEach(() => {
    useLikeStore.setState({ likes: { p1: { like: false, likeCount: 5 } } })
})

describe('LikeButton', () => {
    it('should render the like count', () => {
        render(<LikeButton postId="p1"/>);
        expect(screen.getByRole('button', { name: /like/i })).toHaveTextContent('5')
    })

    it('should have data-liked="false" when not liked', () => {
        render(<LikeButton postId="p1" />);
        expect(screen.getByRole('button', { name: /like/i })).toHaveAttribute('data-liked', 'false')
    })

    it('should have data-liked="true" when liked', () => {
        useLikeStore.setState({ likes: { p1: { like: true, likeCount: 6 } } })
        render(<LikeButton postId="p1" />);
        expect(screen.getByRole('button', { name: /like/i })).toHaveAttribute('data-liked', 'true')
    })

    it('should call toggle with postId on click', async () => {
        const toggle = vi.fn()
        useLikeStore.setState({ likes: { p1: { like: false, likeCount: 5 } }, toggle })
        const user = userEvent.setup()
        render(<LikeButton postId="p1" />)
        await user.click(screen.getByRole('button', { name: /like/i }))
        expect(toggle).toHaveBeenCalledWith('p1')
    })
})