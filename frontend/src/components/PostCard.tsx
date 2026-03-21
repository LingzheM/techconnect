import { useState } from 'react'
import { deletePost } from '../api/posts'
import { useAuthStore } from '../stores/authStore'
import { useFeedStore } from '../stores/feedStore'
import { LikeButton } from './LikeButton'
import type { Post } from '../api/posts'

type Props = { post: Post }

export function PostCard({ post }: Props) {
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleted, setDeleted] = useState(false)

    const currentUser = useAuthStore(s => s.user)
    const removePost = useFeedStore(s => s.removePost)

    if (deleted) return null

    const isAuthor = currentUser?.id === post.author.id

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            await deletePost(post.id)
            removePost(post.id)
            setDeleted(true)
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <article className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm shrink-0">
                        {post.author.username[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <a
                            href={`/profile/${post.author.id}`}
                            className="font-semibold text-sm text-gray-900 hover:underline"
                        >
                            {post.author.username}
                        </a>
                        <p className="text-xs text-gray-400">
                            {new Date(post.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                {isAuthor && (
                    <button
                        aria-label="delete"
                        disabled={isDeleting}
                        onClick={handleDelete}
                        className="text-gray-400 hover:text-red-500 text-xs disabled:opacity-40 transition-colors shrink-0"
                    >
                        {isDeleting ? '…' : 'Delete'}
                    </button>
                )}
            </div>

            <p className="mt-3 text-sm text-gray-800 leading-relaxed">{post.content}</p>

            <div className="mt-3">
                <LikeButton postId={post.id} />
            </div>
        </article>
    )
}
