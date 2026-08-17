import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const alias = { '@': fileURLToPath(new URL('.', import.meta.url)) }

export default defineConfig({
  test: {
    projects: [
      {
        resolve: { alias },
        ssr: { resolve: { conditions: ['react-server'] } },
        test: { name: 'api', environment: 'node', include: ['test/*.test.ts'] },
      },
      {
        resolve: { alias },
        test: { name: 'components', environment: 'jsdom', include: ['test/*.test.tsx'] },
      },
    ],
  },
})
