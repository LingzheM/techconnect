import { useFeedStore } from "../stores/feedStore";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import { PostCard } from "../components/PostCard";

export function FeedPage() {
    const posts = useFeedStore(s => s.posts)
    const hasMore = useFeedStore(s => s.hasMore)
    const isLoading = useFeedStore(s => s.isLoading)
    const loadMore = useFeedStore(s => s.loadMore)

    const sentinelRef = useInfiniteScroll(() => {
        if (!isLoading) loadMore()
    })

    return (
        <div>
            {posts.map(post => (
                <PostCard key={post.id} post={post} />
            ))}

            {isLoading && <div role="status">Loading...</div>}
            {!hasMore && <p>No more posts</p>}
            {hasMore && <div ref={sentinelRef}></div>}
        </div>
    )
}