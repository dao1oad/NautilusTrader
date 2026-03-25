import type { AdminEvent } from "../types/admin";


export type InvalidationTopic =
  | "overview"
  | "nodes"
  | "strategies"
  | "adapters"
  | "orders"
  | "positions"
  | "accounts"
  | "logs";

type InvalidationListener = (topic: InvalidationTopic, event: AdminEvent) => void;

const listeners = new Set<InvalidationListener>();

function getInvalidationTopics(event: AdminEvent): InvalidationTopic[] {
  if (event.type === "overview.updated" || event.type === "snapshot.invalidate") {
    return ["overview", "nodes", "strategies", "adapters", "orders", "positions", "accounts", "logs"];
  }

  return [];
}

export function publishInvalidation(event: AdminEvent) {
  const topics = getInvalidationTopics(event);

  if (topics.length === 0) {
    return;
  }

  for (const topic of topics) {
    for (const listener of listeners) {
      listener(topic, event);
    }
  }
}

export function subscribeToInvalidations(listener: InvalidationListener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
