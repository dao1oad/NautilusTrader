import type { CommandEvent } from "../types/admin";
import type { AdminEvent } from "../types/admin";


export type InvalidationTopic =
  | "overview"
  | "nodes"
  | "strategies"
  | "adapters"
  | "audit"
  | "config"
  | "orders"
  | "fills"
  | "positions"
  | "accounts"
  | "risk"
  | "logs";

type InvalidationListener = (topic: InvalidationTopic, event: AdminEvent) => void;

const listeners = new Set<InvalidationListener>();

function getInvalidationTopics(event: AdminEvent): InvalidationTopic[] {
  if (
    event.type === "command.accepted" ||
    event.type === "command.completed" ||
    event.type === "command.failed"
  ) {
    return ["audit", "config"];
  }

  if (event.type === "overview.updated" || event.type === "snapshot.invalidate") {
    return ["overview", "nodes", "strategies", "adapters", "orders", "fills", "positions", "accounts", "risk", "logs"];
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
