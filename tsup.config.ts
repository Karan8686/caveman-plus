import { defineConfig } from 'tsup';

export default defineConfig([
  // Library build — CJS + ESM + types, no shebang
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
  },
  // CLI build — ESM only, with shebang so npm treats it as a valid binary
  {
    entry: { 'adapters/cli': 'src/adapters/cli.ts' },
    format: ['esm'],
    dts: false,
    clean: false,
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
]);
