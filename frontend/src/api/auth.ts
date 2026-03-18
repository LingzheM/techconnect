import { client } from './client'

export type AuthUser = { id: string; username: string; email: string; avatarUrl?: string | null }
export type AuthResult = { token: string; user: AuthUser }

export const register = async (data: {
  email: string
  username: string
  password: string
}): Promise<AuthResult> => {
  const res = await client.post<AuthResult>('/auth/register', data)
  return res.data
}

export const login = async (data: {
  email: string
  password: string
}): Promise<AuthResult> => {
  const res = await client.post<AuthResult>('/auth/login', data)
  return res.data
}
