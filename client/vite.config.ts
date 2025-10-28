import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), nodePolyfills()],
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
