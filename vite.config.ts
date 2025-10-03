import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'url';

export default defineConfig({
  plugins: [],
  resolve: {
    alias: {
      // Set up the '@' alias to point to the 'src' directory
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    // globals: true, // Optional: to avoid importing describe, it, etc. in every file
  },
});