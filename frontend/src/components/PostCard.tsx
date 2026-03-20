import { useState } from "react";
import { deletePost } from "../api/posts";
import { useAuthStore } from "../stores/authStore";
import { useFeedStore } from "../stores/feedStore";
import { useLikeStore } from "../stores/likeStore";
import type { Post } from "../api/posts";

type Props = { post: Post }

export function PostCard({ post }: Props) {
   const [isDeleting, setIsDeleting] = useState(false) 
   const [deleted, setDeleted] = useState(false)

   const currentUser = useAuthStore(s => s.user)
   const removePost = useFeedStore(s => s.removePost)
   const toggle = useLikeStore(s => s.toggle)
   const likeState = useLikeStore(s => s.likes[post.id])

    if (deleted) return null    // 所有hooks之后再return

   const liked = likeState?.like ?? false
   const likeCount = likeState?.likeCount ?? post.likeCount
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
    <article>
        <span>{post.author.username}</span>
        <p>{post.content}</p>

        <button
            aria-label="like"
            data-liked={String(liked)}
            onClick={() => toggle(post.id)}
        >
            {likeCount}
        </button>

        {isAuthor && (
            <button
                aria-label="delete"
                disabled={isDeleting}
                onClick={handleDelete}
            >
                Delete
            </button>
        )}
    </article>
   )
}