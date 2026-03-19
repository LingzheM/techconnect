import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from './authStore'

const mockUser = { id: '1', username: 'alice', avatarUrl: null }

beforeEach(() => {
  localStorage.clear()
  useAuthStore.setState({ token: null, user: null })
})

describe('authStore — initial state', () => {
  it('should start with null token and user', () => {
    const { token, user } = useAuthStore.getState()
    expect(token).toBeNull()
    expect(user).toBeNull()
  })
})

describe('authStore — setAuth', () => {
  it('should set token and user in state', () => {
    useAuthStore.getState().setAuth('tok123', mockUser)
    const { token, user } = useAuthStore.getState()
    expect(token).toBe('tok123')
    expect(user?.username).toBe('alice')
  })

  it('should persist token in store after setAuth', () => {
    useAuthStore.getState().setAuth('tok123', mockUser)
    expect(useAuthStore.getState().token).toBe('tok123')
  })
  
})

describe('authStore — logout', () => {
  it('should clear token from store after logout', () => {
  useAuthStore.getState().setAuth('tok123', mockUser)
  useAuthStore.getState().logout()
  expect(useAuthStore.getState().token).toBeNull()
})

  it('should remove token from localStorage', () => {
    useAuthStore.getState().setAuth('tok123', mockUser)
    useAuthStore.getState().logout()
    expect(localStorage.getItem('token')).toBeNull()
  })
})

describe('authStore — persistence across calls', () => {
  it('should reflect updated token after a second setAuth', () => {
    useAuthStore.getState().setAuth('old', mockUser)
    useAuthStore.getState().setAuth('new', { ...mockUser, username: 'bob' })
    expect(useAuthStore.getState().token).toBe('new')
    expect(localStorage.getItem('token')).toBeNull()
  })
})
