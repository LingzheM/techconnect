import { client } from './client'

export type ToggleLikeResult = { liked: boolean; likeCount: number }

export const toggleLike = async (postId: string): Promise<ToggleLikeResult> => {
  const res = await client.post<ToggleLikeResult>(`/posts/${postId}/like`)
  return res.data
}
