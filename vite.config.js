import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/seo-audit-dashboard/', // Update this if your repo name changes
})
