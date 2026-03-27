import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { defineConfig } from "@playwright/test";


const frontendRoot = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = resolve(frontendRoot, "../..");
const bundleDir = resolve(frontendRoot, "dist");
const workspaceRoot = resolve(repoRoot, "../..");
const pythonCandidates = [
  resolve(repoRoot, ".venv", "bin", "python"),
  resolve(workspaceRoot, ".venv", "bin", "python")
];
const pythonBin =
  process.env.NAUTILUS_ADMIN_E2E_PYTHON_BIN ??
  pythonCandidates.find((candidate) => existsSync(candidate)) ??
  "python3";
const port = 4173;
const serverScript = resolve(frontendRoot, "tests/e2e/serve_admin_app.py");
const webServerCommand = `bash -lc 'cd "${repoRoot}" && test -f "${bundleDir}/index.html" && NAUTILUS_ADMIN_E2E_PORT="${port}" NAUTILUS_ADMIN_FRONTEND_DIR="${bundleDir}" "${pythonBin}" "${serverScript}"'`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "on-first-retry"
  },
  webServer: {
    command: webServerCommand,
    port,
    reuseExistingServer: false,
    timeout: 120_000
  }
});
