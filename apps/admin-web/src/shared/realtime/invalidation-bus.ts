import type { AdminEvent } from "../types/admin";


export type InvalidationTopic = "overview";

type InvalidationListener = (topic: InvalidationTopic, event: AdminEvent) => void;

const listeners = new Set<InvalidationListener>();

function getInvalidationTopic(event: AdminEvent): InvalidationTopic | null {
  if (event.type === "overview.updated" || event.type === "snapshot.invalidate") {
    return "overview";
  }

  return null;
}

export function publishInvalidation(event: AdminEvent) {
  const topic = getInvalidationTopic(event);

  if (!topic) {
    return;
  }

  for (const listener of listeners) {
    listener(topic, event);
  }
}

export function subscribeToInvalidations(listener: InvalidationListener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
