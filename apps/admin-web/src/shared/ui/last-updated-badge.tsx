import { useI18n } from "../i18n/use-i18n";
import { SignalPill } from "./signal-pill";


type Props = {
  timestamp: string;
  stale?: boolean;
};

function formatTimestamp(
  timestamp: string,
  t: (key: "state.lastUpdated.unavailable" | "state.lastUpdated.timestamp", params?: { timestamp: string }) => string
) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return {
      dateTime: undefined,
      text: t("state.lastUpdated.unavailable")
    };
  }

  return {
    dateTime: date.toISOString(),
    text: t("state.lastUpdated.timestamp", {
      timestamp: date.toISOString().replace("T", " ").slice(0, 19)
    })
  };
}

export function LastUpdatedBadge({ timestamp, stale = false }: Props) {
  const { t } = useI18n();
  const formattedTimestamp = formatTimestamp(timestamp, t);
  const signalLabel = stale ? t("state.lastUpdated.stale") : t("state.lastUpdated.current");

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
