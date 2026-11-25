import { defineConfig } from "vite"
import site from "./build/site-plugin.ts"

// https://vite.dev/config/
export default defineConfig({
  plugins: [site()],
  build: {
    target: "es2020",
    modulePreload: { polyfill: false },
  },
})
