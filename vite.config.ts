import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { port: 8080, open: true },
  // Phaser 자체가 커서 나오는 용량 경고 끄기
  build: { chunkSizeWarningLimit: 2000 },
});
