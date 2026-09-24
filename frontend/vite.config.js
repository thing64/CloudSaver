import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    sourcemap: true,
    target: "es2022",
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
});
