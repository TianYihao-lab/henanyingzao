import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/henanyingzao/", 

  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) {
            return "react-vendor";
          }
          if (
            id.includes("node_modules/echarts") ||
            id.includes("node_modules/echarts-for-react") ||
            id.includes("node_modules/zrender")
          ) {
            return "echarts-vendor";
          }
        },
      },
    },
  },
  server: {
    host: "127.0.0.1",
    port: 4176,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 4177,
    strictPort: true,
  },
});