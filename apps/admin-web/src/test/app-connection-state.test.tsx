import { afterEach, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

import type { OverviewSnapshot } from "../shared/types/admin";


type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
};


function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });

  return { promise, resolve };
}


afterEach(() => {
  vi.resetModules();
});


test("keeps stale connection state after a pending overview refresh resolves", async () => {
  const deferred = createDeferred<OverviewSnapshot>();

  vi.doMock("../shared/api/admin-client", () => ({
    getOverviewSnapshot: vi.fn(() => deferred.promise)
  }));

  vi.doMock("../shared/realtime/admin-events", () => ({
    subscribeToAdminEvents: vi.fn(({ onStateChange }: { onStateChange: (state: "stale") => void }) => {
      onStateChange("stale");
      return () => {};
    })
  }));

  const { App } = await import("../app");

  render(<App />);

  expect(screen.getAllByText("Connection stale").length).toBeGreaterThan(0);

  deferred.resolve({
    generated_at: "2026-03-23T00:00:00Z",
    stale: false,
    partial: false,
    node: { status: "not_configured", node_id: null },
    strategies: [],
    adapters: [],
    accounts: [],
    positions: [],
    errors: []
  });

  await waitFor(() => {
    expect(screen.getAllByText("Connection stale").length).toBeGreaterThan(0);
  });

  expect(screen.queryByText("Connected")).not.toBeInTheDocument();
});


test("does not force disconnected state when overview refresh fails but websocket is connected", async () => {
  vi.doMock("../shared/api/admin-client", () => ({
    getOverviewSnapshot: vi.fn(async () => {
      throw new Error("Transient overview failure");
    })
  }));

  vi.doMock("../shared/realtime/admin-events", () => ({
    subscribeToAdminEvents: vi.fn(({ onStateChange }: { onStateChange: (state: "connected") => void }) => {
      onStateChange("connected");
      return () => {};
    })
  }));

  const { App } = await import("../app");

  render(<App />);

  await waitFor(() => {
    expect(screen.getByText("Connected")).toBeInTheDocument();
    expect(screen.getByText("Transient overview failure")).toBeInTheDocument();
  });

  expect(screen.queryByText("Disconnected")).not.toBeInTheDocument();
});
