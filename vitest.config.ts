import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    // Pure-logic tests run in node (fast). Tests that touch the DOM
    // (shadow roots, MutationObserver, custom elements) opt into jsdom via
    // `// @vitest-environment jsdom` at the top of the file.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
