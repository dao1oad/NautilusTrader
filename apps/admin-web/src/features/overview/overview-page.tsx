import type { ConnectionState, OverviewSnapshot } from "../../shared/types/admin";


type Props = {
  connectionState?: ConnectionState;
  snapshot?: OverviewSnapshot | null;
  error?: string | null;
};


export function OverviewPage({ connectionState, snapshot, error }: Props = {}) {
  let copy = "Waiting for admin snapshot.";

  if (error) {
    copy = error;
  } else if (snapshot?.node.status === "not_configured") {
    copy = "No live node configured";
  } else if (snapshot) {
    copy = `Node status: ${snapshot.node.status}`;
  } else if (!snapshot && connectionState === "disconnected") {
    copy = "Disconnected from admin API";
  }

  return (
    <section className="overview-card">
      <h2>Overview</h2>
      {connectionState === "stale" ? <p className="overview-alert">Connection stale</p> : null}
      <p className="overview-copy">{copy}</p>
    </section>
  );
}
