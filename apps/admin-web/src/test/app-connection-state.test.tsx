import { afterEach, expect, test, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";

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

  expect((await screen.findAllByText("Connection stale")).length).toBeGreaterThan(0);

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


test("clears transient server errors once a fresh overview snapshot arrives", async () => {
  const deferred = createDeferred<OverviewSnapshot>();

  vi.doMock("../shared/api/admin-client", () => ({
    getOverviewSnapshot: vi.fn(() => deferred.promise)
  }));

  vi.doMock("../shared/realtime/admin-events", () => ({
    subscribeToAdminEvents: vi.fn(
      ({
        onEvent,
        onStateChange
      }: {
        onEvent: (event: { type: "server.error"; code: string; message: string }) => void;
        onStateChange: (state: "connected") => void;
      }) => {
        onStateChange("connected");
        queueMicrotask(() => {
          onEvent({
            type: "server.error",
            code: "transient",
            message: "Stream hiccup"
          });
        });
        return () => {};
      }
    )
  }));

  const { App } = await import("../app");

  render(<App />);

  deferred.resolve({
    generated_at: "2026-03-24T00:00:00Z",
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
    expect(screen.getByText("Connected")).toBeInTheDocument();
    expect(screen.getByText("No live node configured")).toBeInTheDocument();
  });

  expect(screen.queryByText("Connection stale")).not.toBeInTheDocument();
});


test("keeps transient server errors visible until an invalidated overview refetch succeeds", async () => {
  const deferred = createDeferred<OverviewSnapshot>();
  let invalidateOverview: ((topic: "overview") => void) | undefined;
  let emitEvent:
    | ((event: { type: "server.error"; code: string; message: string }) => void)
    | undefined;
  let requestCount = 0;

  vi.doMock("../shared/api/admin-client", () => ({
    getOverviewSnapshot: vi.fn(async () => {
      requestCount += 1;

      if (requestCount === 1) {
        return {
          generated_at: "2026-03-24T00:00:00Z",
          stale: false,
          partial: false,
          node: { status: "not_configured", node_id: null },
          strategies: [],
          adapters: [],
          accounts: [],
          positions: [],
          errors: []
        };
      }

      return deferred.promise;
    })
  }));

  vi.doMock("../shared/realtime/invalidation-bus", () => ({
    subscribeToInvalidations: vi.fn((listener: (topic: "overview") => void) => {
      invalidateOverview = listener;
      return () => {};
    })
  }));

  vi.doMock("../shared/realtime/admin-events", () => ({
    subscribeToAdminEvents: vi.fn(
      ({
        onEvent,
        onStateChange
      }: {
        onEvent: (event: { type: "server.error"; code: string; message: string }) => void;
        onStateChange: (state: "connected") => void;
      }) => {
        onStateChange("connected");
        emitEvent = onEvent;
        return () => {};
      }
    )
  }));

  const { App } = await import("../app");

  render(<App />);

  await waitFor(() => {
    expect(screen.getByText("No live node configured")).toBeInTheDocument();
  });

  act(() => {
    emitEvent?.({
      type: "server.error",
      code: "transient",
      message: "Stream hiccup"
    });
  });

  await waitFor(() => {
    expect(screen.getByText("Overview refresh failed")).toBeInTheDocument();
    expect(screen.getByText("Stream hiccup")).toBeInTheDocument();
  });

  act(() => {
    invalidateOverview?.("overview");
  });

  await waitFor(() => {
    expect(requestCount).toBe(2);
  });

  expect(screen.getByText("Overview refresh failed")).toBeInTheDocument();
  expect(screen.getByText("Stream hiccup")).toBeInTheDocument();

  deferred.resolve({
    generated_at: "2026-03-24T01:00:00Z",
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
    expect(screen.getByText("No live node configured")).toBeInTheDocument();
  });

  expect(screen.queryByText("Overview refresh failed")).not.toBeInTheDocument();
  expect(screen.queryByText("Stream hiccup")).not.toBeInTheDocument();
});
