import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { useI18n } from "../i18n/use-i18n";
import { SectionPanel } from "./section-panel";
import { SignalPill } from "./signal-pill";


type StateBannerKind = "loading" | "empty" | "error" | "stale";

type Props = Omit<ComponentPropsWithoutRef<"section">, "title"> & {
  description?: ReactNode;
  kind: StateBannerKind;
  meta?: ReactNode;
  title: ReactNode;
};

export function StateBanner({ className, description, kind, meta, title, ...rest }: Props) {
  const { t } = useI18n();
  const stateSignals: Record<
    StateBannerKind,
    {
      label: string;
      tone: "neutral" | "info" | "warning" | "danger";
    }
  > = {
    loading: {
      label: t("state.signals.loading"),
      tone: "info"
    },
    empty: {
      label: t("state.signals.empty"),
      tone: "neutral"
    },
    error: {
      label: t("state.signals.error"),
      tone: "danger"
    },
    stale: {
      label: t("state.signals.stale"),
      tone: "warning"
    }
  };
  const signal = stateSignals[kind];
  const bannerClassName = className ? `state-banner ${className}` : "state-banner";

  return (
    <SectionPanel
      className={bannerClassName}
      data-kind={kind}
      description={description}
      eyebrow={t("state.runtimeState")}
      meta={meta}
      signal={<SignalPill className="state-banner-signal" label={signal.label} tone={signal.tone} />}
      title={title}
      {...rest}
    />
  );
}
