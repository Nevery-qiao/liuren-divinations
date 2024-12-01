import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/liuren/',
  plugins: [vue()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'vue-router'],
          'lunar': ['lunar-typescript']
        }
      }
    },
    assetsDir: 'assets',
    minify: 'terser',
    sourcemap: false
  },
  server: {
    proxy: {
      '/api/proxy': {
        target: 'https://demo1.w258.cn/2024',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/proxy/, '/xlr/pan.php'),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    }
  },
  preview: {
    port: 4173,
    strictPort: true,
    proxy: {
      '/api/proxy': {
        target: 'https://demo1.w258.cn/2024',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/proxy/, '/xlr/pan.php'),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    }
  }
})
