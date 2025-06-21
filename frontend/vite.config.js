import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  
  // Performance optimizations
  build: {
    // Enable code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'animation': ['framer-motion'],
          'ui': ['react-toastify'],
          'firebase': ['firebase/app', 'firebase/auth'],
          'qr': ['qr-scanner', 'qrcode']
        }
      }
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  
  // Development optimizations
  server: {
    // Enable HMR
    hmr: true,
    // Optimize deps
    force: true
  },
  
  // Dependency optimization
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
  
  // Asset optimization
  assetsInclude: ['**/*.webp', '**/*.avif'],
  
  // Enable source maps for development only
  build: {
    ...defineConfig.build,
    sourcemap: process.env.NODE_ENV === 'development'
  }
})