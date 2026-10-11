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
    // Four test files enumerate src/content/articles, and two of them write
    // fixture articles into it. In parallel workers a fixture is visible to
    // whichever file happens to be listing the directory at that moment, which
    // fails as an unrelated assertion somewhere else. The whole suite runs in
    // well under a second, so there is nothing to win by overlapping them.
    fileParallelism: false,
  },
});
