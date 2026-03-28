import type { ConnectionState } from "../../shared/types/admin";
import { useI18n } from "../../shared/i18n/use-i18n";
import { SignalPill } from "../../shared/ui/signal-pill";

type Props = {
  state: ConnectionState;
};


export function ConnectionBanner({ state }: Props) {
  const { t } = useI18n();
  const stateSignals: Record<
    ConnectionState,
    {
      label: string;
      tone: "info" | "positive" | "warning" | "danger";
    }
  > = {
    connected: {
      label: t("state.connection.connected"),
      tone: "positive"
    },
    connecting: {
      label: t("state.connection.connecting"),
      tone: "info"
    },
    disconnected: {
      label: t("state.connection.disconnected"),
      tone: "danger"
    },
    stale: {
      label: t("state.connection.stale"),
      tone: "warning"
    }
  };
  const signal = stateSignals[state];

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
