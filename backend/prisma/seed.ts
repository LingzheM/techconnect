import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('Seeding...')

    // Clean up
    await prisma.like.deleteMany()
    await prisma.follow.deleteMany()
    await prisma.post.deleteMany()
    await prisma.user.deleteMany()

    const hash = (pw: string) => bcrypt.hash(pw, 10)

    // Users
    const [alice, bob, charlie, diana] = await Promise.all([
        prisma.user.create({
            data: {
                email: 'alice@example.com',
                username: 'alice',
                password: await hash('password123'),
                bio: 'Frontend dev. React & TypeScript enthusiast.',
            },
        }),
        prisma.user.create({
            data: {
                email: 'bob@example.com',
                username: 'bob',
                password: await hash('password123'),
                bio: 'Backend engineer. Go & Postgres.',
            },
        }),
        prisma.user.create({
            data: {
                email: 'charlie@example.com',
                username: 'charlie',
                password: await hash('password123'),
                bio: 'Full-stack. Building in public.',
            },
        }),
        prisma.user.create({
            data: {
                email: 'diana@example.com',
                username: 'diana',
                password: await hash('password123'),
                bio: 'DevOps & infra.',
            },
        }),
    ])

    // Posts
    const postData = [
        { authorId: alice.id, content: 'Just shipped a new feature using Intersection Observer for infinite scroll — no scroll event listeners needed. Browser APIs are underrated.' },
        { authorId: alice.id, content: 'TIL: Zustand\'s `setState` does a shallow merge by default. For nested updates you need to spread manually. Caught me off guard the first time.' },
        { authorId: alice.id, content: 'Hot take: most apps don\'t need Redux. A few Zustand stores and you\'re done.' },
        { authorId: bob.id, content: 'Cursor-based pagination > LIMIT/OFFSET. No duplicate rows when new content is inserted mid-scroll. Why isn\'t this the default everywhere?' },
        { authorId: bob.id, content: 'Writing integration tests that hit a real database is painful to set up but pays off every time. Caught a migration bug this week that mocked tests would have missed.' },
        { authorId: bob.id, content: 'Prisma transactions are great for keeping likeCount in sync. One atomic operation, no race conditions.' },
        { authorId: charlie.id, content: 'Day 47 of building in public: TDD is slow at first and then suddenly it\'s faster than any other approach I\'ve tried.' },
        { authorId: charlie.id, content: 'MSW (Mock Service Worker) for API mocking in tests is a game changer. Your tests use real fetch/axios, the mock just lives at the network layer.' },
        { authorId: charlie.id, content: 'Hono is genuinely fast. First time I\'ve enjoyed writing a Node.js backend in years.' },
        { authorId: diana.id, content: 'Reminder: `docker compose watch` exists and does hot-reload for your containers. Stopped manually restarting services last month and never looked back.' },
        { authorId: diana.id, content: 'If your CI pipeline takes more than 5 minutes, it\'s a productivity problem. Invest in parallelism early.' },
        { authorId: diana.id, content: 'Postgres EXPLAIN ANALYZE is the most useful tool I reach for when something is slow. Every backend dev should be comfortable reading query plans.' },
    ]

    const posts = await Promise.all(
        postData.map((data, i) =>
            prisma.post.create({
                data: {
                    ...data,
                    createdAt: new Date(Date.now() - (postData.length - i) * 3_600_000),
                },
            })
        )
    )

    // Follows: alice↔bob, alice→charlie, charlie→bob, diana→alice
    await prisma.follow.createMany({
        data: [
            { followerId: alice.id, followingId: bob.id },
            { followerId: bob.id, followingId: alice.id },
            { followerId: alice.id, followingId: charlie.id },
            { followerId: charlie.id, followingId: bob.id },
            { followerId: diana.id, followingId: alice.id },
        ],
    })

    // Likes
    const likePairs: [string, number][] = [
        [bob.id, 0], [charlie.id, 0], [diana.id, 0],
        [alice.id, 3], [charlie.id, 3], [diana.id, 3],
        [alice.id, 6], [bob.id, 6],
        [alice.id, 9], [bob.id, 9], [charlie.id, 9],
    ]

    for (const [userId, postIdx] of likePairs) {
        await prisma.like.create({ data: { userId, postId: posts[postIdx].id } })
        await prisma.post.update({
            where: { id: posts[postIdx].id },
            data: { likeCount: { increment: 1 } },
        })
    }

    console.log('Done. Users: alice, bob, charlie, diana (password: password123)')
}

main()
    .catch(e => { console.error(e); process.exit(1) })
    .finally(() => prisma.$disconnect())
