import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";

import { queryClient } from "../shared/query/query-client";


afterEach(() => {
  queryClient.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
