import { defineConfig } from 'vite';

// GitHub Pages serves this repo at /haydens-desk/. The dev server stays at /,
// while the production build and `vite preview` use the Pages path.
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'serve' && !isPreview ? '/' : '/haydens-desk/',
}));
