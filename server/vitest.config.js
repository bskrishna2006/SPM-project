import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    hookTimeout: 180000, // 3 minutes for first-time binary download/start
    testTimeout: 60000,
  },
});
