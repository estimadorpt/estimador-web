import path from 'node:path';
import { defineConfig } from 'vitest/config';

// Unit tests for pure logic only (no DOM, no Next runtime). Scoped to src/ so
// the build output in .next/ and out/ is never picked up.
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
