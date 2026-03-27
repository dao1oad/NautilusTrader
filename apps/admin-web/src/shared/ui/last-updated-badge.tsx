import { SignalPill } from "./signal-pill";


type Props = {
  timestamp: string;
  stale?: boolean;
};

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return {
      dateTime: undefined,
      text: "Last updated unavailable"
    };
  }

  return {
    dateTime: date.toISOString(),
    text: `Last updated ${date.toISOString().replace("T", " ").slice(0, 19)} UTC`
  };
}

export function LastUpdatedBadge({ timestamp, stale = false }: Props) {
  const formattedTimestamp = formatTimestamp(timestamp);
  const signalLabel = stale ? "Snapshot delayed" : "Snapshot current";

  return (
    <div className="last-updated-badge" data-stale={stale ? "true" : "false"}>
      <SignalPill
        className="last-updated-pill"
        label={signalLabel}
        tone={stale ? "warning" : "positive"}
      />
      {formattedTimestamp.dateTime ? (
        <time className="last-updated-value" dateTime={formattedTimestamp.dateTime}>
          {formattedTimestamp.text}
        </time>
      ) : (
        <span className="last-updated-value">{formattedTimestamp.text}</span>
      )}
    </div>
  );
}
