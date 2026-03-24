// @vitest-environment node

import { afterEach, expect, test, vi } from "vitest";

const originalAdminApiOrigin = process.env.NAUTILUS_ADMIN_API_ORIGIN;

afterEach(() => {
  vi.resetModules();

  if (originalAdminApiOrigin === undefined) {
    delete process.env.NAUTILUS_ADMIN_API_ORIGIN;
  } else {
    process.env.NAUTILUS_ADMIN_API_ORIGIN = originalAdminApiOrigin;
  }
});

async function loadViteConfig() {
  const module = await import("../../vite.config");
  return module.default;
}

test("dev server proxies admin api and websocket routes by default", async () => {
  delete process.env.NAUTILUS_ADMIN_API_ORIGIN;

  const config = await loadViteConfig();

  expect(config.server?.proxy?.["/api/admin"]).toMatchObject({
    target: "http://127.0.0.1:8000/",
    changeOrigin: true
  });
  expect(config.server?.proxy?.["/ws/admin"]).toMatchObject({
    target: "ws://127.0.0.1:8000/",
    changeOrigin: true,
    ws: true
  });
});

test("dev server proxy target can be overridden", async () => {
  process.env.NAUTILUS_ADMIN_API_ORIGIN = "https://admin.example.test:9443";

  const config = await loadViteConfig();

  expect(config.server?.proxy?.["/api/admin"]).toMatchObject({
    target: "https://admin.example.test:9443/",
    changeOrigin: true
  });
  expect(config.server?.proxy?.["/ws/admin"]).toMatchObject({
    target: "wss://admin.example.test:9443/",
    changeOrigin: true,
    ws: true
  });
});
