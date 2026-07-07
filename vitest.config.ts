import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    globals: true,
    // Pure-logic tests run in node (fast). Tests that touch the DOM
    // (shadow roots, MutationObserver, custom elements) opt into jsdom via
    // `// @vitest-environment jsdom` at the top of the file.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: [
      {
        // Route .css imports to a Lit CSSResult stub. The real .css → CSSResult
        // transform is done by rollup-plugin-postcss-lit at build time, which
        // isn't active under vitest; vite's native CSS pipeline hangs here.
        // The regex must match the *whole* specifier — vite replaces only the
        // matched part, so `/\.css$/` alone would mangle the path.
        find: /^.+\.css$/,
        replacement: fileURLToPath(
          new URL('./src/test/__mocks__/styleMock.ts', import.meta.url),
        ),
      },
    ],
  },
});
