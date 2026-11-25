import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ตอนพัฒนา (npm run dev) ส่งคำขอ /api ไปที่เซิร์ฟเวอร์เกมที่พอร์ต 3001
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': 'http://localhost:3001' },
  },
})
