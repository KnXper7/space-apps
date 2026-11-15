import { defineConfig } from 'vite';
// The built game goes one folder up (the repo root), so the root index.html just works
// with Live Server and with GitHub Pages ("Deploy from a branch", main, / (root)).
export default defineConfig({ base: './', build: { target: 'es2020', chunkSizeWarningLimit: 2000, outDir: '..', emptyOutDir: false } });
