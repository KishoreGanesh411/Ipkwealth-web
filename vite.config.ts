// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [
    react(),
    svgr({ svgrOptions: { icon: true } }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      components: fileURLToPath(new URL("./src/components", import.meta.url)),
    },
  },
  server: {
    proxy: {
      // All frontend requests to /graphql will be proxied to the API
      "/graphql": {
        target: "http://localhost:3333",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
