export type ConnectionState = "connected" | "connecting" | "disconnected" | "stale";


const STATE_LABELS: Record<ConnectionState, string> = {
  connected: "Connected",
  connecting: "Connecting",
  disconnected: "Disconnected",
  stale: "Connection stale"
};


type Props = {
  state: ConnectionState;
};


export function ConnectionBanner({ state }: Props) {
  return (
    <div aria-live="polite" className="connection-banner" data-state={state}>
      {STATE_LABELS[state]}
    </div>
  );
}
