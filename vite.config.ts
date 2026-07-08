import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react';
          }

          if (id.includes('node_modules/gsap') || id.includes('node_modules/lenis')) {
            return 'motion';
          }

          return undefined;
        }
      }
    }
  },
  server: {
    host: '127.0.0.1',
    port: 5173
  }
});
