import { useLikeStore } from "../stores/likeStore";

type Props = { postId: string }

export function LikeButton({ postId }: Props) {
    const toggle = useLikeStore(s => s.toggle)
    const likeState = useLikeStore(s => s.likes[postId])

    const liked = likeState?.like ?? false
    const likeCount = likeState?.likeCount ?? 0

    return (
        <button
            aria-label="like"
            data-liked={String(liked)}
            onClick={() => toggle(postId)}
        >
            {likeCount}
        </button>
    )
}