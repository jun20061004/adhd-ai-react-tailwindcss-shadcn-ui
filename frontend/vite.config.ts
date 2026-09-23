import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    preserveSymlinks: true,
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    fs: {
      strict: false
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      // rewrite参数作用：请求拦截转换器。
      // 全局作用：在请求真实到达后端前，利用正则表达式将路径中的/api/v1替换为空字符串。后端实际收到的请求路径将变为/tasks。
      rewrite: (path) => path.replace(/^\/api\/v1/, '')
      }
    }
  }
});
