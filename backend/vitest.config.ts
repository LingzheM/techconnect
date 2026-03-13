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
        // 集成测试
        pool: 'forks',
        poolOptions: {
            forks: { singleFork: true }
        }
    },
})