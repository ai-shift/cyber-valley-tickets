import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import reactSWC from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [reactSWC(), tailwindcss(), nodePolyfills()],
  envPrefix: "PUBLIC_",
  server: {
    port: Number(process.env.VITE_PORT),
    proxy: {
      "/api": {
        target: `http://127.0.0.1:${process.env.BACKEND_PORT}`,
        changeOrigin: true,
      },
      "/ganache": {
        target: `http://127.0.0.1:${process.env.GANACHE_PORT}`,
        rewrite: (path) => path.replace(/^\/ganache/, ""),
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
