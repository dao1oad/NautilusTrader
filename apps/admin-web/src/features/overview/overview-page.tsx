import type { ConnectionState, OverviewSnapshot } from "../../shared/types/admin";
import { LastUpdatedBadge } from "../../shared/ui/last-updated-badge";
import { PageState } from "../../shared/ui/page-state";


type Props = {
  connectionState?: ConnectionState;
  snapshot?: OverviewSnapshot | null;
  error?: string | null;
  isLoading?: boolean;
};


export function OverviewPage({ connectionState, snapshot, error, isLoading = false }: Props = {}) {
  const isStale = connectionState === "stale" || snapshot?.stale === true;
  const lastUpdated = snapshot ? <LastUpdatedBadge stale={isStale} timestamp={snapshot.generated_at} /> : null;

  if (isLoading && !snapshot) {
    return (
      <PageState
        kind="loading"
        title="Loading overview"
        description="Waiting for the latest admin snapshot."
      />
    );
  }

  if (error && !snapshot) {
    return <PageState kind="error" title="Overview unavailable" description={error} />;
  }

  if (!snapshot && connectionState === "stale") {
    return (
      <PageState
        kind="stale"
        title="Connection stale"
        description="Waiting for a fresh admin snapshot."
      />
    );
  }

  if (!snapshot && connectionState === "disconnected") {
    return (
      <PageState
        kind="stale"
        title="Disconnected from admin API"
        description="Reconnect the admin API to refresh runtime state."
      />
    );
  }

  if (!snapshot) {
    return (
      <PageState
        kind="loading"
        title="Loading overview"
        description="Waiting for the latest admin snapshot."
      />
    );
  }

  if (isStale) {
    return (
      <PageState
        kind="stale"
        title="Connection stale"
        description={error ?? "Showing the last successfully received admin snapshot."}
        meta={lastUpdated}
      />
    );
  }

  if (snapshot.node.status === "not_configured") {
    return (
      <PageState
        kind="empty"
        title="No live node configured"
        description="Connect a live node to populate runtime operations data."
        meta={lastUpdated}
      />
    );
  }

  return (
    <section className="overview-card">
      <div className="overview-header">
        <div>
          <h2>Overview</h2>
          <p className="overview-copy">{`Node status: ${snapshot.node.status}`}</p>
        </div>
        {lastUpdated}
      </div>
    </section>
  );
}
