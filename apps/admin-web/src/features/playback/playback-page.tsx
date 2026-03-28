import { useQuery } from "@tanstack/react-query";

import { useAdminRuntime } from "../../app/admin-runtime";
import { useWorkbenchShellMeta } from "../../app/workbench-shell-meta";
import {
  getPlaybackSnapshot,
  PLAYBACK_DEFAULT_END_TIME,
  PLAYBACK_DEFAULT_START_TIME,
  READ_ONLY_DEFAULT_LIMIT
} from "../../shared/api/admin-client";
import { adminQueryKeys } from "../../shared/query/query-client";
import type { PlaybackSnapshot } from "../../shared/types/admin";
import { LastUpdatedBadge } from "../../shared/ui/last-updated-badge";
import { PageState } from "../../shared/ui/page-state";
import { SectionPanel } from "../../shared/ui/section-panel";
import { SignalPill } from "../../shared/ui/signal-pill";
import { WorkbenchHeader } from "../../shared/ui/workbench-header";
import { PlaybackPreviewChart } from "./playback-preview-chart";


const PLAYBACK_COPY =
  "Bounded replay request, preview chart, and projected event stream for the selected analysis window.";

function renderResourceErrors(errors: Array<{ section: string; message: string }>) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <ul className="resource-errors">
      {errors.map((resourceError) => (
        <li key={`${resourceError.section}:${resourceError.message}`}>
          <strong>{resourceError.section}</strong>
          {`: ${resourceError.message}`}
        </li>
      ))}
    </ul>
  );
}

function buildPlaybackStatusSummary(snapshot: PlaybackSnapshot | null) {
  if (!snapshot) {
    return "Awaiting bounded replay telemetry.";
  }

  return `${snapshot.events.length} projected events, ${snapshot.timeline.length} timeline points, limit ${snapshot.request.limit}.`;
}

export function PlaybackPage() {
  const { connectionState, error: runtimeError } = useAdminRuntime();
  const query = useQuery({
    queryKey: adminQueryKeys.playback(READ_ONLY_DEFAULT_LIMIT, PLAYBACK_DEFAULT_START_TIME, PLAYBACK_DEFAULT_END_TIME),
    queryFn: () => getPlaybackSnapshot(READ_ONLY_DEFAULT_LIMIT, PLAYBACK_DEFAULT_START_TIME, PLAYBACK_DEFAULT_END_TIME)
  });

  const snapshot = query.data ?? null;
  const error = query.error instanceof Error ? query.error.message : runtimeError;
  const hasCachedError = Boolean(error) && Boolean(snapshot);
  const isStale = connectionState === "stale" || hasCachedError;
  const lastUpdated = snapshot ? <LastUpdatedBadge stale={isStale} timestamp={snapshot.generated_at} /> : null;

  useWorkbenchShellMeta({
    lastUpdated: snapshot?.generated_at ?? null,
    pageTitle: "Playback",
    statusSummary: buildPlaybackStatusSummary(snapshot),
    workbenchCopy: PLAYBACK_COPY
  });

  if (query.isLoading && !snapshot) {
    return <PageState kind="loading" title="Playback" description="Loading bounded playback diagnostics." />;
  }

  if (error && !snapshot) {
    return <PageState kind="error" title="Playback" description={error} />;
  }

  if (!snapshot) {
    return <PageState kind="loading" title="Playback" description="Waiting for playback diagnostics." />;
  }

  if (isStale) {
    return (
      <PageState
        kind="stale"
        title="Playback"
        description={error ?? "Showing the last successfully received playback preview."}
        meta={lastUpdated}
      />
    );
  }

  return (
    <div className="resource-stack">
      <WorkbenchHeader
        description={PLAYBACK_COPY}
        eyebrow="Analysis workbench"
        summary={buildPlaybackStatusSummary(snapshot)}
        title="Playback"
      >
        <SignalPill
          detail={`${snapshot.events.length} projected events`}
          label={snapshot.request.request_id}
          tone={snapshot.partial ? "warning" : "info"}
        />
        {lastUpdated}
      </WorkbenchHeader>

      <SectionPanel
        description="Bounded request parameters and operator feedback for the selected UTC replay window."
        eyebrow="Replay request"
        title="Bounded request"
      >
        {snapshot.partial ? <p className="resource-alert">Showing the latest partial playback snapshot.</p> : null}
        {renderResourceErrors(snapshot.errors)}
        <div className="detail-stack">
          <dl className="resource-detail-grid">
            <div>
              <dt>Request</dt>
              <dd>{snapshot.request.request_id}</dd>
            </div>
            <div>
              <dt>Catalog</dt>
              <dd>{snapshot.request.catalog_id}</dd>
            </div>
            <div>
              <dt>Instrument</dt>
              <dd>{snapshot.request.instrument_id}</dd>
            </div>
            <div>
              <dt>Window</dt>
              <dd>{`${snapshot.request.start_time} to ${snapshot.request.end_time}`}</dd>
            </div>
            <div>
              <dt>Limit</dt>
              <dd>{snapshot.request.limit}</dd>
            </div>
            <div>
              <dt>Speed</dt>
              <dd>{snapshot.request.speed}</dd>
            </div>
          </dl>

          <section className="detail-section">
            <h4>Playback feedback</h4>
            <p className="command-receipt-copy">{snapshot.request.feedback}</p>
            <ul className="detail-list">
              {snapshot.operator_notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </section>
        </div>
      </SectionPanel>

      <SectionPanel
        description="Projected mid-price path for the bounded replay window."
        eyebrow="Preview path"
        title="Playback preview"
      >
        <PlaybackPreviewChart timeline={snapshot.timeline} />
      </SectionPanel>

      <SectionPanel
        description="Projected event stream remains bounded to the selected UTC window and event limit."
        eyebrow="Projected event stream"
        title="Projected events"
      >
        <table aria-label="Projected playback events" className="resource-table">
          <thead>
            <tr>
              <th scope="col">Time</th>
              <th scope="col">Type</th>
              <th scope="col">Summary</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.events.map((event) => (
              <tr key={`${event.timestamp}:${event.event_type}`}>
                <td>{event.timestamp}</td>
                <td>{event.event_type}</td>
                <td>{event.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionPanel>
    </div>
  );
}
