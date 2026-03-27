import { defineConfig } from "vite";

const defaultAdminApiOrigin = "http://127.0.0.1:8000";
const adminApiOrigin = process.env.NAUTILUS_ADMIN_API_ORIGIN ?? defaultAdminApiOrigin;
const adminApiUrl = new URL(adminApiOrigin);
const adminWsUrl = new URL(adminApiUrl.toString());

adminWsUrl.protocol = adminApiUrl.protocol === "https:" ? "wss:" : "ws:";

export default defineConfig({
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
