import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['./src/test/setup.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
        },
        // 集成测试共享同一个数据库，必须串行跑，否则 beforeEach 互相干扰
        fileParallelism: false,
        pool: 'forks',
        poolOptions: {
            forks: { singleFork: true }
        }
    },
})