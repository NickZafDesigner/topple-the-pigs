import { cpSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { defineConfig } from 'vite';

// The game is plain HTML, CSS and one classic script. Vite serves and bundles
// the page, but it will not transform js/game.js (no type="module"). That file
// is copied into dist unchanged, next to the script tag index.html already has.
// Three.js r128 and cannon.js 0.6.2 stay on the CDN tags in index.html.
export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
  build: {
    target: 'es2020',
  },
  plugins: [
    {
      name: 'copy-game-script',
      apply: 'build',
      closeBundle() {
        const to = resolve('dist/js/game.js');
        mkdirSync(dirname(to), { recursive: true });
        cpSync(resolve('js/game.js'), to);
      },
    },
  ],
});
