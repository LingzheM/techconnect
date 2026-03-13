import { execSync } from "child_process";
import { beforeAll, afterAll } from 'vitest';
import { prisma } from '../lib/prisma'

beforeAll(() => {
    execSync('npx prisma migrate deploy', {
        env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
    })
})

afterAll(async () => {
    await prisma.$disconnect()
})