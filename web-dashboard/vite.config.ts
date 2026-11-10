import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// v45.33 · G5 — /api is proxied to the FastAPI backend (python3 server.py, port 8000).
// That backend now owns the shared handoff record (GET/POST /api/state → data/state/handoff.json),
// so the next employee on another machine sees the same resolutions/defers/notes/activity.
// If the backend is not running, the UI degrades honestly to "Local only · server offline".
export default defineConfig({
  base: '/critical-corporate-document-management/',
  plugins: [react(), tailwindcss()],
  server: {
    // v45.33 · G5 — server.py owns these data directories (handoff record, LLM results, uploads).
    // chokidar events from them used to trigger Vite full-page reloads mid-session; ignore them.
    watch: {
      ignored: ['**/data/state/**', '**/data/results/**', '**/data/uploads/**'],
    },
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
