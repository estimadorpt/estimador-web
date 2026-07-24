import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

// Wires the `@/*` -> `./src/*` alias (from tsconfig.json) so tests can import
// shared modules the same way the app does. `npm run test` == `vitest run`.
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
