import { publishCommandReceipt } from "./command-receipt-bus";
import { publishInvalidation } from "./invalidation-bus";
import type { AdminEvent, ConnectionState } from "../types/admin";


type Options = {
  onEvent: (event: AdminEvent) => void;
  onStateChange: (state: ConnectionState) => void;
};


function buildWebSocketUrl(): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws/admin/events`;
}


export function subscribeToAdminEvents({ onEvent, onStateChange }: Options): () => void {
  if (typeof WebSocket === "undefined") {
    return () => {};
  }

  const socket = new WebSocket(buildWebSocketUrl());
  let isClosing = false;
  onStateChange("connecting");

  socket.addEventListener("open", () => {
    onStateChange("connected");
    socket.send(JSON.stringify({ type: "subscribe", channels: ["overview", "commands"] }));
  });

  socket.addEventListener("message", (message) => {
    const event = JSON.parse(message.data) as AdminEvent;

    if (event.type === "connection.state") {
      onStateChange(event.state);
    }

    if (
      event.type === "command.accepted" ||
      event.type === "command.completed" ||
      event.type === "command.failed"
    ) {
      publishCommandReceipt(event);
    }

    publishInvalidation(event);
    onEvent(event);
  });

  socket.addEventListener("error", () => {
    if (!isClosing) {
      onStateChange("stale");
    }
  });

  socket.addEventListener("close", () => {
    if (!isClosing) {
      onStateChange("stale");
    }
  });

  return () => {
    isClosing = true;
    socket.close();
  };
}
