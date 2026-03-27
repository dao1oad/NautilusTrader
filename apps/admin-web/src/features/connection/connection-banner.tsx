import type { ConnectionState } from "../../shared/types/admin";
import { SignalPill } from "../../shared/ui/signal-pill";


const STATE_SIGNALS: Record<
  ConnectionState,
  {
    label: string;
    tone: "info" | "positive" | "warning" | "danger";
  }
> = {
  connected: {
    label: "Link healthy",
    tone: "positive"
  },
  connecting: {
    label: "Establishing link",
    tone: "info"
  },
  disconnected: {
    label: "Link offline",
    tone: "danger"
  },
  stale: {
    label: "Snapshot delayed",
    tone: "warning"
  }
};


type Props = {
  state: ConnectionState;
};


export function ConnectionBanner({ state }: Props) {
  const signal = STATE_SIGNALS[state];

  return (
    <SignalPill
      aria-live="polite"
      className="connection-banner"
      data-state={state}
      label={signal.label}
      role="status"
      tone={signal.tone}
    />
  );
}
