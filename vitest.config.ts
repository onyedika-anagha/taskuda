import { mergeConfig, defineConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}', 'api/**/*.test.ts', 'server/**/*.test.ts', 'config/**/*.test.ts'],
      css: false,
      // UI flows plus PBKDF2 can pass 5 s when all files run in parallel on a busy machine.
      testTimeout: 15_000,
    },
  }),
)
