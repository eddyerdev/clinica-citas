import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    // Durante desarrollo, si corres el frontend fuera de Docker con
    // "pnpm dev" directo, esto redirige las llamadas a /api hacia el
    // backend sin problemas de CORS. En producción (Nginx), el proxy
    // real lo hace nginx.conf en vez de esto.
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});