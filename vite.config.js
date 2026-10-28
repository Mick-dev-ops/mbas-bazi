import { defineConfig } from 'vite';
// 相對資產 + hash 導覽：使用者／專案 Pages 與任意子目錄均可部署。
export default defineConfig({
  base: './',
  server: { allowedHosts: ['terminal.local'] },
  build: { target: 'es2022' },
  test: { environment: 'node', include: ['tests/**/*.test.js'] },
});
