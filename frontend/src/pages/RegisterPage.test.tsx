import { describe, it, expect, beforeEach } from 'vitest'
import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../test/server'
import { useAuthStore } from '../stores/authStore'
import { RegisterPage } from './RegisterPage'

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/register']}>
      <RegisterPage />
    </MemoryRouter>
  )

const mockUser = { id: 'u1', username: 'alice', email: 'alice@example.com', avatarUrl: null }

beforeEach(() => {
  useAuthStore.setState({ token: null, user: null })
})

// ── 渲染 ────────────────────────────────────────────────────────────────────

describe('RegisterPage — render', () => {
  it('should render email, username, password inputs and a submit button', () => {
    renderPage()

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument()
  })

  it('should render a link to the login page', () => {
    renderPage()

    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument()
  })
})

// ── 成功注册 ─────────────────────────────────────────────────────────────────

describe('RegisterPage — success', () => {
  beforeEach(() => {
    server.use(
      http.post('*/auth/register', () =>
        HttpResponse.json({ token: 'tok-xyz', user: mockUser }, { status: 201 })
      )
    )
  })

  it('should set auth store with token and user on success', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText(/email/i), 'alice@example.com')
    await user.type(screen.getByLabelText(/username/i), 'alice')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(useAuthStore.getState().token).toBe('tok-xyz')
      expect(useAuthStore.getState().user?.username).toBe('alice')
    })
  })
})

// ── 加载状态 ─────────────────────────────────────────────────────────────────

describe('RegisterPage — loading state', () => {
  it('should disable submit button while request is in-flight', async () => {
    let settle!: () => void
    server.use(
      http.post('*/auth/register', () =>
        new Promise(resolve => {
          settle = () => resolve(HttpResponse.json({ token: 't', user: mockUser }, { status: 201 }))
        })
      )
    )

    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText(/email/i), 'alice@example.com')
    await user.type(screen.getByLabelText(/username/i), 'alice')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /register/i }))

    expect(screen.getByRole('button', { name: /register/i })).toBeDisabled()

    settle()
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /register/i })).not.toBeDisabled()
    )
  })
})

// ── 失败 ─────────────────────────────────────────────────────────────────────

describe('RegisterPage — error', () => {
  it('should show error when email is already taken (409)', async () => {
    server.use(
      http.post('*/auth/register', () =>
        HttpResponse.json({ error: 'Email already in use' }, { status: 409 })
      )
    )

    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText(/email/i), 'taken@example.com')
    await user.type(screen.getByLabelText(/username/i), 'alice')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  it('should not update authStore on failure', async () => {
    server.use(
      http.post('*/auth/register', () =>
        HttpResponse.json({ error: 'Email already in use' }, { status: 409 })
      )
    )

    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText(/email/i), 'taken@example.com')
    await user.type(screen.getByLabelText(/username/i), 'alice')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => screen.getByRole('alert'))

    expect(useAuthStore.getState().token).toBeNull()
  })
})
