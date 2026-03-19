import { describe, it, expect, beforeEach, vi } from 'vitest'
import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../test/server'
import { useAuthStore } from '../stores/authStore'
import { LoginPage } from './LoginPage'

const renderPage = (initialPath = '/login') =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LoginPage />
    </MemoryRouter>
  )

beforeEach(() => {
  useAuthStore.setState({ token: null, user: null })
  localStorage.clear()
})

// ── 渲染 ────────────────────────────────────────────────────────────────────

describe('LoginPage — render', () => {
  it('should render email, password inputs and a submit button', () => {
    renderPage()

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })

  it('should render a link to the register page', () => {
    renderPage()

    expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument()
  })
})

// ── 成功登录 ─────────────────────────────────────────────────────────────────

describe('LoginPage — success', () => {
  beforeEach(() => {
    server.use(
      http.post('*/auth/login', () =>
        HttpResponse.json({ token: 'tok-abc', user: { id: 'u1', username: 'alice', email: 'alice@example.com', avatarUrl: null } })
      )
    )
  })

  it('should call login API with entered credentials', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText(/email/i), 'alice@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => {
      expect(useAuthStore.getState().token).toBe('tok-abc')
      expect(useAuthStore.getState().user?.username).toBe('alice')
    })
  })

})

// ── 加载状态 ─────────────────────────────────────────────────────────────────

describe('LoginPage — loading state', () => {
  it('should disable the submit button while request is in-flight', async () => {
    let settle!: () => void
    server.use(
      http.post('*/auth/login', () =>
        new Promise(resolve => {
          settle = () => resolve(HttpResponse.json({ token: 't', user: { id: 'u1', username: 'a', email: 'a@a.com', avatarUrl: null } }))
        })
      )
    )

    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText(/email/i), 'a@a.com')
    await user.type(screen.getByLabelText(/password/i), 'pass')
    await user.click(screen.getByRole('button', { name: /login/i }))

    expect(screen.getByRole('button', { name: /login/i })).toBeDisabled()

    settle()
    await waitFor(() => expect(screen.getByRole('button', { name: /login/i })).not.toBeDisabled())
  })
})

// ── 失败 ─────────────────────────────────────────────────────────────────────

describe('LoginPage — error', () => {
  it('should display error message on failed login', async () => {
    server.use(
      http.post('*/auth/login', () =>
        HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      )
    )

    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText(/email/i), 'wrong@example.com')
    await user.type(screen.getByLabelText(/password/i), 'wrongpass')
    await user.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  it('should not update authStore on failed login', async () => {
    server.use(
      http.post('*/auth/login', () =>
        HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      )
    )

    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText(/email/i), 'wrong@example.com')
    await user.type(screen.getByLabelText(/password/i), 'wrongpass')
    await user.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => screen.getByRole('alert'))

    expect(useAuthStore.getState().token).toBeNull()
  })
})
