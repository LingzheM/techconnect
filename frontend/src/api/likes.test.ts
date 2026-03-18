import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../test/server'
import { toggleLike } from './likes'

const BASE = 'http://localhost:3000'

describe('likes.toggleLike', () => {
  it('should POST /posts/:id/like and return liked + likeCount', async () => {
    server.use(
      http.post(`${BASE}/posts/:id/like`, () =>
        HttpResponse.json({ liked: true, likeCount: 1 }),
      ),
    )

    const result = await toggleLike('p1')

    expect(result.liked).toBe(true)
    expect(result.likeCount).toBe(1)
  })

  it('should hit the correct post id in the URL', async () => {
    let capturedId: string | undefined

    server.use(
      http.post(`${BASE}/posts/:id/like`, ({ params }) => {
        capturedId = params.id as string
        return HttpResponse.json({ liked: false, likeCount: 0 })
      }),
    )

    await toggleLike('post-abc')

    expect(capturedId).toBe('post-abc')
  })
})
