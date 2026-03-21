import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useInfiniteScroll } from './useInfiniteScroll'

let observerCallback: IntersectionObserverCallback
let mockObserve: ReturnType<typeof vi.fn>
let mockDisconnect: ReturnType<typeof vi.fn>

beforeEach(() => {
    mockObserve = vi.fn()
    mockDisconnect = vi.fn()
    vi.stubGlobal(
        'IntersectionObserver',
        vi.fn(function (cb: IntersectionObserverCallback) {
            observerCallback = cb
            return { observe: mockObserve, disconnect: mockDisconnect, unobserve: vi.fn() }
        }),
    )
})

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('useInfiniteScroll', () => {
    it('should observe the sentinel element when ref is attached', () => {
        const { result } = renderHook(() => useInfiniteScroll(vi.fn()))

        const sentinel = document.createElement('div')
        act(() => result.current(sentinel))

        expect(mockObserve).toHaveBeenCalledWith(sentinel)
    })

    it('should call onIntersect when sentinel enters the viewport', () => {
        const onIntersect = vi.fn()
        const { result } = renderHook(() => useInfiniteScroll(onIntersect))

        const sentinel = document.createElement('div')
        act(() => result.current(sentinel))

        act(() =>
            observerCallback(
                [{ isIntersecting: true }] as IntersectionObserverEntry[],
                {} as IntersectionObserver,
            ),
        )

        expect(onIntersect).toHaveBeenCalledOnce()
    })

    it('should NOT call onIntersect when sentinel is not intersecting', () => {
        const onIntersect = vi.fn()
        const { result } = renderHook(() => useInfiniteScroll(onIntersect))

        const sentinel = document.createElement('div')
        act(() => result.current(sentinel))

        act(() =>
            observerCallback(
                [{ isIntersecting: false }] as IntersectionObserverEntry[],
                {} as IntersectionObserver,
            ),
        )

        expect(onIntersect).not.toHaveBeenCalled()
    })

    it('should disconnect the observer when the component unmounts', () => {
        const { result, unmount } = renderHook(() => useInfiniteScroll(vi.fn()))

        const sentinel = document.createElement('div')
        act(() => result.current(sentinel))

        unmount()

        expect(mockDisconnect).toHaveBeenCalledOnce()
    })
})
