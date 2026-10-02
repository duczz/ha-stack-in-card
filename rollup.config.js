import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';
import inject from 'rollup-plugin-inject-process-env';

const dev = !!process.env.ROLLUP_WATCH;

const plugins = [
  // Pin Lit's production export. Without it, node-resolve picks the
  // `development` condition whenever NODE_ENV is set to anything else, and
  // Lit's dev build (larger, with dev-mode warnings) lands in the bundle.
  resolve({ browser: true, exportConditions: ['production'] }),
  json(),
  inject({
    BUILD_TIME: new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  }),
  typescript({ sourceMap: dev, inlineSources: dev }),
];

export default [
  {
    input: 'src/stack-in-card.ts',
    output: {
      file: 'dist/stack-in-card.js',
      format: 'es',
      sourcemap: dev ? 'inline' : false,
      inlineDynamicImports: true,
    },
    plugins: dev
      ? plugins
      : [...plugins, terser({ format: { comments: false } })],
  },
];
