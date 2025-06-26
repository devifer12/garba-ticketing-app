import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],

  // ✅ Base path for proper routing in production
  base: '/',

  // ✅ Build config
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'animation': ['framer-motion'],
          'firebase': ['firebase/app', 'firebase/auth']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },

  // ✅ SPA fallback handling via dev server
  server: {
    hmr: true,
    historyApiFallback: true // Add this
  },

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'firebase/app',
      'firebase/auth'
    ],
    exclude: ['qr-scanner']
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})