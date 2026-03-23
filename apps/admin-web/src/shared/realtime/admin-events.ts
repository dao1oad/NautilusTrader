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
  onStateChange("connecting");

  socket.addEventListener("open", () => {
    onStateChange("connected");
    socket.send(JSON.stringify({ type: "subscribe", channels: ["overview"] }));
  });

  socket.addEventListener("message", (message) => {
    const event = JSON.parse(message.data) as AdminEvent;

    if (event.type === "connection.state") {
      onStateChange(event.state);
    }

    onEvent(event);
  });

  socket.addEventListener("error", () => {
    onStateChange("stale");
  });

  socket.addEventListener("close", () => {
    onStateChange("stale");
  });

  return () => {
    socket.close();
  };
}
