
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 3000, open: true },
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          babylon: ['@babylonjs/core'],
          react: ['react', 'react-dom', 'framer-motion'],
          peerjs: ['peerjs'],
        },
      },
    },
  },
  worker: { format: 'es' },
});
