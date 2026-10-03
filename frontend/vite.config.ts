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
  },
  build: {
    rollupOptions: {
      output: {
        // inlineDynamicImports参数作用：控制Rollup构建时的动态模块聚合策略。
        // 全局作用：强制将整个项目中所有的动态导入(DynamicImport)和按需加载的分包模块彻底打包到一个单一的JavaScript文件中，阻断内容脚本在宿主网页沙箱内向外发起chrome-extension://invalid/的无效资源探测请求，确保Chrome扩展能够稳定无错地注入执行。
        inlineDynamicImports: true
      }
    }
  }
});