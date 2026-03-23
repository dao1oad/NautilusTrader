import type { ConnectionState } from "../connection/connection-banner";


type Props = {
  connectionState?: ConnectionState;
  snapshot?: unknown;
  error?: string | null;
};


export function OverviewPage({ connectionState, snapshot, error }: Props = {}) {
  let copy = "Phase 0 overview shell is ready for typed admin snapshot wiring.";

  if (connectionState === "stale") {
    copy = "Connection stale";
  } else if (error) {
    copy = error;
  } else if (!snapshot && connectionState === "disconnected") {
    copy = "Disconnected from admin API";
  }

  return (
    <section className="overview-card">
      <h2>Overview</h2>
      <p className="overview-copy">{copy}</p>
    </section>
  );
}
