import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { temmlSurrogates } from "../desktop/vite-temml-surrogates";

// Set by `tauri android dev` so the device WebView can reach the dev server.
const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  // Temml's lexer survives bundling only with this rewrite (desktop shares it).
  plugins: [temmlSurrogates()],
  optimizeDeps: { exclude: ["temml"] },
  clearScreen: false,
  server: {
    port: 1421,
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: "ws", host, port: 1422 } : undefined,
    watch: { ignored: ["**/src-tauri/**"] },
    // The kernel is imported straight from ../src/kernel (single source).
    fs: { allow: [fileURLToPath(new URL("..", import.meta.url))] },
  },
  envPrefix: ["VITE_", "TAURI_ENV_"],
  build: { target: "es2022" },
});
