import { defineConfig } from "vite";

const defaultAdminApiOrigin = "http://127.0.0.1:8000";
const adminApiOrigin = process.env.NAUTILUS_ADMIN_API_ORIGIN ?? defaultAdminApiOrigin;
const adminApiUrl = new URL(adminApiOrigin);
const adminWsUrl = new URL(adminApiUrl.toString());

adminWsUrl.protocol = adminApiUrl.protocol === "https:" ? "wss:" : "ws:";

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/lightweight-charts")) {
            return "charts";
          }

          if (
            id.includes("node_modules/@radix-ui/") ||
            id.includes("node_modules/radix-ui") ||
            id.includes("node_modules/react-remove-scroll-bar") ||
            id.includes("node_modules/classnames")
          ) {
            return "radix-theme";
          }

          return undefined;
        }
      }
    }
  },
  server: {
    proxy: {
      "/api/admin": {
        target: adminApiUrl.toString(),
        changeOrigin: true
      },
      "/ws/admin": {
        target: adminWsUrl.toString(),
        changeOrigin: true,
        ws: true
      }
    }
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/test/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["tests/e2e/**"],
    setupFiles: "./src/test/setup.ts"
  }
});
