import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig(({ mode }) => ({
  root: path.resolve(__dirname, "./client"),
  base: mode === "production" ? "/" : "/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "./dist"),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    host: "0.0.0.0",
  },
}));
