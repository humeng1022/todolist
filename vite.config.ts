import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

// * 别名映射由 TECH.md 第 13 节锁定：@ -> ./src，不得修改。
export default defineConfig({
  // GitHub Pages 项目页部署在 /<仓库名>/ 子路径下。使用相对基路径，
  // 资源会自动解析为 ./assets/...，无需把仓库名硬编码到配置里。
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
