type Props = {
  timestamp: string;
  stale?: boolean;
};

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Last updated unavailable";
  }

  return `Last updated ${date.toISOString().replace("T", " ").slice(0, 19)} UTC`;
}

export function LastUpdatedBadge({ timestamp, stale = false }: Props) {
  return (
    <div className="last-updated-badge" data-stale={stale ? "true" : "false"}>
      {formatTimestamp(timestamp)}
    </div>
  );
}
