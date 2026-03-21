import { useLikeStore } from '../stores/likeStore'

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
            className={`flex items-center gap-1.5 text-sm transition-colors ${
                liked
                    ? 'text-indigo-500 font-medium'
                    : 'text-gray-400 hover:text-indigo-500'
            }`}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill={liked ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={2}
                className="w-4 h-4"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                />
            </svg>
            {likeCount}
        </button>
    )
}
