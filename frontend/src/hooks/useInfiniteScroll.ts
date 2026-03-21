import { useCallback, useEffect, useRef } from "react";

export function useInfiniteScroll(onIntersect: () => void) {
    const callbackRef = useRef(onIntersect)
    callbackRef.current = onIntersect

    const observerRef = useRef<IntersectionObserver | null>(null)

    const sentinelRef = useCallback((node: Element | null) => {
        observerRef.current?.disconnect()
        if (!node) return

        observerRef.current = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                callbackRef.current()
            }
        })
        observerRef.current.observe(node)
    }, [])

    useEffect(() => {
        return () => observerRef.current?.disconnect()
    }, [])

    return sentinelRef
}