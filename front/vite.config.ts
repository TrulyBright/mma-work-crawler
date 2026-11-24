import { defineConfig } from 'vite'
import mmaData from './build/data-plugin'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [mmaData()],
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'preact',
  },
  build: {
    target: 'es2020',
    modulePreload: { polyfill: false },
  },
})
