import { defineConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default defineConfig({
  plugins: viteConfig.plugins,
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    env: { VITE_API_URL: 'http://localhost:3000' },
    coverage: { provider: 'v8', reporter: ['text', 'html'], include: ['src/**/*.{ts,tsx}'], exclude: ['src/main.tsx', 'src/types/**'] },
  },
});
