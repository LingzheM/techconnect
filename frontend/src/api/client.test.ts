import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../test/server'
import { client } from './client'

const BASE = 'http://localhost:3000'

describe('api client', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should send requests without Authorization header when no token is stored', async () => {
    let capturedAuth: string | null = null

    server.use(
      http.get(`${BASE}/ping`, ({ request }) => {
        capturedAuth = request.headers.get('Authorization')
        return HttpResponse.json({ ok: true })
      }),
    )

    await client.get('/ping')
    expect(capturedAuth).toBeNull()
  })

  it('should attach Bearer token from localStorage when present', async () => {
    localStorage.setItem('token', 'my-test-token')
    let capturedAuth: string | null = null

    server.use(
      http.get(`${BASE}/ping`, ({ request }) => {
        capturedAuth = request.headers.get('Authorization')
        return HttpResponse.json({ ok: true })
      }),
    )

    await client.get('/ping')
    expect(capturedAuth).toBe('Bearer my-test-token')
  })
})
