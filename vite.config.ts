import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'url';
import { vitePluginMdToHTML } from 'vite-plugin-md-to-html';
import { resolve } from 'path';


export default defineConfig({
  base: '/facet-filter-page/',
  define: {
    '__APP_VERSION__': JSON.stringify(process.env.npm_package_version),
  },
  plugins: [vitePluginMdToHTML()],

  build: {
    rollupOptions: {
      input: {
        main: resolve(fileURLToPath(new URL('.', import.meta.url)), 'index.html'),
        about: resolve(fileURLToPath(new URL('.', import.meta.url)), 'about.html'),
      },
    },
  },

  resolve: {
    alias: {
      // Set up the '@' alias to point to the 'src' directory
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    // globals: true, // Optional: to avoid importing describe, it, etc. in every file
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**', // Exclude E2E tests from the unit test runner
    ],
  },
});