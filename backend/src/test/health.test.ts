import { describe, it, expect } from "vitest";
import { prisma } from "../lib/prisma";


describe('Database connection', () => {
    it('should connect to test database', async () => {
        const result = await prisma.$queryRaw<[{ result: bigint }]>`SELECT 1 as result`
        expect(Number(result[0].result)).toBe(1)
    })
})