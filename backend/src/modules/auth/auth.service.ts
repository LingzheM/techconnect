import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../../lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET ?? 'fallback-secret'
const SALT_ROUNDS = 10

type RegisterInput = {
  email: string
  username: string
  password: string
}

type LoginInput = {
  email: string
  password: string
}

type AuthResult = {
  token: string
  user: {
    id: string
    email: string
    username: string
    password: string
    avatarUrl: string | null
    bio: string | null
    createdAt: Date
  }
}

const generateToken = (userId: string): string => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
}

export const AuthService = {
  async register(input: RegisterInput): Promise<AuthResult> {
    const { email, username, password } = input

    // 检查重复（利用数据库唯一索引的 Prisma 错误也可以，
    // 但先手动查更容易返回友好错误信息）
    const existingEmail = await prisma.user.findUnique({ where: { email } })
    if (existingEmail) throw new Error('Email already in use')

    const existingUsername = await prisma.user.findUnique({ where: { username } })
    if (existingUsername) throw new Error('Username already in use')

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

    const user = await prisma.user.create({
      data: { email, username, password: hashedPassword },
    })

    const token = generateToken(user.id)

    return { token, user }
  },

  async login(input: LoginInput): Promise<AuthResult> {
    const { email, password } = input

    const user = await prisma.user.findUnique({ where: { email } })

    // 注意：用户不存在和密码错误返回同一个错误信息
    // 防止攻击者通过错误信息枚举已注册的邮箱
    if (!user) throw new Error('Invalid credentials')

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) throw new Error('Invalid credentials')

    const token = generateToken(user.id)

    return { token, user }
  },
}