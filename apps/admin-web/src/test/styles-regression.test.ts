// @vitest-environment node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";


const styles = readFileSync(resolve(import.meta.dirname, "../styles.css"), "utf8");


test("terminal styling does not force dark UA controls onto light-surface inputs", () => {
  expect(styles).not.toMatch(/:root\s*\{[^}]*color-scheme:\s*dark/i);
  expect(styles).toMatch(/\.resource-filter-input\s*\{[^}]*color-scheme:\s*light/i);
  expect(styles).toMatch(/\.confirm-dialog-input\s*\{[^}]*color-scheme:\s*light/i);
});
