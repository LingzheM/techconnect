import { describe, it, expect, beforeEach } from "vitest";
import { createAdaptorServer } from "@hono/node-server";
import supertest from "supertest";
import { prisma } from "../../lib/prisma";
import { AuthService } from './auth.service'
import app from '../../app'

const server = createAdaptorServer(app)

// 每个测试前清空User表
beforeEach(async () => {
    await prisma.like.deleteMany()
    await prisma.comment.deleteMany()
    await prisma.post.deleteMany()
    await prisma.follow.deleteMany()
    await prisma.user.deleteMany()
})

describe('AuthService', () => {
    describe('register', () =>{
        it('should create a new user and return a token', async () => {
            const input = {
                email: 'test@example.com',
                username: 'testuser',
                password: 'password123',
            }

            // Act
            const { token, user } = await AuthService.register(input)

            // Assert
            expect(token).toBeDefined()
            expect(user.email).toBe(input.email)
            expect(user.username).toBe(input.username)

            expect(user.password).not.toBe(input.password)
        })

        it('should throw an error if email already exists', async () => {
            const input  = {
                email: 'duplicate@example.com',
                username: 'user1',
                password: 'password123',
            }

            await AuthService.register(input)

            await expect(
                AuthService.register({ ...input, username: 'user2'})
            ).rejects.toThrow('Email already in use')
        })

        it('should throw an error if email already exists', async () => {
                const input  = {
                    email: 'first@example.com',
                    username: 'sameusername',
                    password: 'password123',
                }

                await AuthService.register(input)

                await expect(
                    AuthService.register({ ...input, username: 'user2'})
                ).rejects.toThrow('Email already in use')
            })
        })
})


describe('POST /auth/register', () => {
    it('should return 201 with token on success', async () => {
        const res = await supertest(server)
            .post('/auth/register')
            .send({ email: 'route@example.com', username: 'routeuser', password: 'password123' })

        expect(res.status).toBe(201)
        expect(res.body.token).toBeDefined()
        expect(res.body.user.email).toBe('route@example.com')
        expect(res.body.user.password).toBeUndefined()
    })

    it('should return 400 on invalid body', async () => {
        const res = await supertest(server)
            .post('/auth/register')
            .send({ email: 'not-an-email', username: 'x', password: '123' })

        expect(res.status).toBe(400)
        expect(res.body.error).toBeDefined()
    })

    it('should return 409 on duplicate email', async () => {
        await supertest(server)
            .post('/auth/register')
            .send({ email: 'dup@example.com', username: 'user1', password: 'password123' })

        const res = await supertest(server)
            .post('/auth/register')
            .send({ email: 'dup@example.com', username: 'user2', password: 'password123' })

        expect(res.status).toBe(409)
    })
})

describe('POST /auth/login', () => {
    it('should return 200 with token on success', async () => {
        await supertest(server)
            .post('/auth/register')
            .send({ email: 'loginroute@example.com', username: 'loginroute', password: 'password123' })

        const res = await supertest(server)
            .post('/auth/login')
            .send({ email: 'loginroute@example.com', password: 'password123' })

        expect(res.status).toBe(200)
        expect(res.body.token).toBeDefined()
    })

    it('should return 400 on invalid body', async () => {
        const res = await supertest(server)
            .post('/auth/login')
            .send({ email: 'not-an-email' })

        expect(res.status).toBe(400)
        expect(res.body.error).toBeDefined()
    })

    it('should return 401 on wrong password', async () => {
        await supertest(server)
            .post('/auth/register')
            .send({ email: 'wrong@example.com', username: 'wronguser', password: 'correctpassword' })

        const res = await supertest(server)
            .post('/auth/login')
            .send({ email: 'wrong@example.com', password: 'wrongpassword' })

        expect(res.status).toBe(401)
    })
})

describe('login', () => {
    it('should return a token with correct credentials', async() => {
        // 先注册一个用户
        await AuthService.register({
            email: 'login@example.com',
            username: 'loginuser',
            password: 'password123',
        })

        // 再用正确密码登录
        const { token, user } = await AuthService.login({
            email: 'login@example.com',
            password: 'password123',
        })

        expect(token).toBeDefined()
        expect(user.email).toBe('login@example.com')
    }) 

    it('should throw an error with wrong password', async () => {
        await AuthService.register({
            email: 'wrong@example.com',
            username: 'wronguser',
            password: 'correctpassword',
        })

        await expect(
            AuthService.login({
                email: 'wrong@example.com',
                password: 'wrongpassword',
            })
        ).rejects.toThrow('Invalid credentials')
    })

    it('should throw an error if user does not exist', async () => {
        await expect(
            AuthService.login({
                email: 'ghost@example.com',
                password: 'anypassword',
            })
        ).rejects.toThrow('Invalid credentials')
    })
})