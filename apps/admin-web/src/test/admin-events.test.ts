import { expect, test, vi } from "vitest";

import { subscribeToAdminEvents } from "../shared/realtime/admin-events";
import { subscribeToCommandReceipts } from "../shared/realtime/command-receipt-bus";
import { subscribeToInvalidations } from "../shared/realtime/invalidation-bus";


type Listener = (event: unknown) => void;


class FakeWebSocket {
  static instances: FakeWebSocket[] = [];

  listeners: Record<string, Listener[]> = {};
  sent: string[] = [];
  url: string;

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }

  addEventListener(type: string, listener: Listener) {
    this.listeners[type] ??= [];
    this.listeners[type].push(listener);
  }

  send(payload: string) {
    this.sent.push(payload);
  }

  close() {
    this.emit("close", new Event("close"));
  }

  emit(type: string, event: unknown) {
    for (const listener of this.listeners[type] ?? []) {
      listener(event);
    }
  }
}


test("cleanup closes the websocket without reporting stale", () => {
  FakeWebSocket.instances = [];

  const onEvent = vi.fn();
  const states: string[] = [];

  vi.stubGlobal("WebSocket", FakeWebSocket as unknown as typeof WebSocket);

  const unsubscribe = subscribeToAdminEvents({
    onEvent,
    onStateChange: (state) => states.push(state)
  });

  const socket = FakeWebSocket.instances[0];
  socket.emit("open", new Event("open"));
  states.length = 0;

  unsubscribe();

  expect(states).toEqual([]);
  expect(onEvent).not.toHaveBeenCalled();
});


test("publishes overview invalidations to the shared bus", () => {
  FakeWebSocket.instances = [];

  const publishedTopics: string[] = [];

  vi.stubGlobal("WebSocket", FakeWebSocket as unknown as typeof WebSocket);

  const unsubscribeInvalidations = subscribeToInvalidations((topic) => {
    publishedTopics.push(topic);
  });

  subscribeToAdminEvents({
    onEvent: vi.fn(),
    onStateChange: vi.fn()
  });

  const socket = FakeWebSocket.instances[0];
  socket.emit("message", {
    data: JSON.stringify({ type: "overview.updated" })
  });

  expect(publishedTopics).toEqual([
    "overview",
    "nodes",
    "strategies",
    "adapters",
    "orders",
    "fills",
    "positions",
    "accounts",
    "logs"
  ]);

  unsubscribeInvalidations();
});


test("subscribes to both overview and command channels on connect", () => {
  FakeWebSocket.instances = [];

  vi.stubGlobal("WebSocket", FakeWebSocket as unknown as typeof WebSocket);

  subscribeToAdminEvents({
    onEvent: vi.fn(),
    onStateChange: vi.fn()
  });

  const socket = FakeWebSocket.instances[0];
  socket.emit("open", new Event("open"));

  expect(socket.sent).toEqual([
    JSON.stringify({ type: "subscribe", channels: ["overview", "commands"] })
  ]);
});


test("publishes command receipts and audit/config invalidations from command events", () => {
  FakeWebSocket.instances = [];

  const publishedTopics: string[] = [];
  const publishedReceipts: string[] = [];

  vi.stubGlobal("WebSocket", FakeWebSocket as unknown as typeof WebSocket);

  const unsubscribeInvalidations = subscribeToInvalidations((topic) => {
    publishedTopics.push(topic);
  });
  const unsubscribeReceipts = subscribeToCommandReceipts((event) => {
    publishedReceipts.push(`${event.type}:${event.receipt.command_id}`);
  });

  subscribeToAdminEvents({
    onEvent: vi.fn(),
    onStateChange: vi.fn()
  });

  const socket = FakeWebSocket.instances[0];
  socket.emit("message", {
    data: JSON.stringify({
      type: "command.completed",
      receipt: {
        command_id: "cmd-1",
        command: "strategy.start",
        target: "strategies/demo",
        status: "completed",
        recorded_at: "2026-03-26T00:00:02Z",
        message: "Command completed for local strategy.start.",
        failure: null
      }
    })
  });

  expect(publishedReceipts).toEqual(["command.completed:cmd-1"]);
  expect(publishedTopics).toEqual(["audit", "config"]);

  unsubscribeReceipts();
  unsubscribeInvalidations();
});
