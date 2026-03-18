import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../test/server'
import { getFeed, getFollowingFeed, createPost, deletePost } from './posts'

const BASE = 'http://localhost:3000'

const mockPost = {
  id: 'p1',
  content: 'Hello',
  likeCount: 0,
  createdAt: new Date().toISOString(),
  author: { id: 'u1', username: 'alice', avatarUrl: null },
}

describe('posts.getFeed', () => {
  it('should GET /posts and return posts + pagination', async () => {
    server.use(
      http.get(`${BASE}/posts`, () =>
        HttpResponse.json({ posts: [mockPost], hasMore: false, nextCursor: null }),
      ),
    )

    const result = await getFeed({})

    expect(result.posts).toHaveLength(1)
    expect(result.posts[0].content).toBe('Hello')
    expect(result.hasMore).toBe(false)
    expect(result.nextCursor).toBeNull()
  })

  it('should pass limit and cursor as query params', async () => {
    let url: string | undefined

    server.use(
      http.get(`${BASE}/posts`, ({ request }) => {
        url = request.url
        return HttpResponse.json({ posts: [], hasMore: false, nextCursor: null })
      }),
    )

    await getFeed({ limit: 5, cursor: 'abc' })

    expect(url).toContain('limit=5')
    expect(url).toContain('cursor=abc')
  })
})

describe('posts.getFollowingFeed', () => {
  it('should GET /posts?feed=following', async () => {
    let url: string | undefined

    server.use(
      http.get(`${BASE}/posts`, ({ request }) => {
        url = request.url
        return HttpResponse.json({ posts: [mockPost], hasMore: false, nextCursor: null })
      }),
    )

    const result = await getFollowingFeed({})

    expect(url).toContain('feed=following')
    expect(result.posts).toHaveLength(1)
  })
})

describe('posts.createPost', () => {
  it('should POST /posts and return the created post', async () => {
    server.use(
      http.post(`${BASE}/posts`, () =>
        HttpResponse.json({ ...mockPost, content: 'New post' }, { status: 201 }),
      ),
    )

    const post = await createPost('New post')

    expect(post.content).toBe('New post')
  })
})

describe('posts.deletePost', () => {
  it('should DELETE /posts/:id', async () => {
    let deletedId: string | undefined

    server.use(
      http.delete(`${BASE}/posts/:id`, ({ params }) => {
        deletedId = params.id as string
        return HttpResponse.json({ success: true })
      }),
    )

    await deletePost('p1')

    expect(deletedId).toBe('p1')
  })
})
