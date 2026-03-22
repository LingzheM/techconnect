import { useEffect } from 'react'
import { useFeedStore } from '../stores/feedStore'
import { useAuthStore } from '../stores/authStore'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'
import { PostCard } from '../components/PostCard'

export function FeedPage() {
    const posts = useFeedStore(s => s.posts)
    const hasMore = useFeedStore(s => s.hasMore)
    const isLoading = useFeedStore(s => s.isLoading)
    const loadFeed = useFeedStore(s => s.loadFeed)
    const loadMore = useFeedStore(s => s.loadMore)
    const currentUser = useAuthStore(s => s.user)
    const logout = useAuthStore(s => s.logout)

    useEffect(() => {
        loadFeed()
    }, [loadFeed])

    const sentinelRef = useInfiniteScroll(() => {
        if (!isLoading) loadMore()
    })

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
                <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
                    <span className="font-bold text-indigo-600 text-lg">TechConnect</span>
                    <nav className="flex items-center gap-4 text-sm">
                        {currentUser ? (
                            <>
                                <a
                                    href={`/profile/${currentUser.id}`}
                                    className="text-gray-600 hover:text-gray-900"
                                >
                                    {currentUser.username}
                                </a>
                                <button
                                    onClick={logout}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <a href="/login" className="text-gray-600 hover:text-gray-900">Login</a>
                                <a
                                    href="/register"
                                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    Sign up
                                </a>
                            </>
                        )}
                    </nav>
                </div>
            </header>

            <main className="max-w-xl mx-auto px-4 py-6 space-y-3">
                {posts.map(post => (
                    <PostCard key={post.id} post={post} />
                ))}

                {isLoading && (
                    <div role="status" className="text-center py-6 text-gray-400 text-sm">
                        Loading...
                    </div>
                )}

                {!hasMore && (
                    <p className="text-center py-6 text-gray-400 text-sm">
                        No more posts
                    </p>
                )}

                {hasMore && <div ref={sentinelRef} className="h-4" />}
            </main>
        </div>
    )
}
