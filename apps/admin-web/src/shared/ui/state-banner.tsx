import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { SectionPanel } from "./section-panel";
import { SignalPill } from "./signal-pill";


type StateBannerKind = "loading" | "empty" | "error" | "stale";

const STATE_SIGNALS: Record<
  StateBannerKind,
  {
    label: string;
    tone: "neutral" | "info" | "warning" | "danger";
  }
> = {
  loading: {
    label: "Acquiring snapshot",
    tone: "info"
  },
  empty: {
    label: "Projection pending",
    tone: "neutral"
  },
  error: {
    label: "Execution blocked",
    tone: "danger"
  },
  stale: {
    label: "Snapshot delayed",
    tone: "warning"
  }
};

type Props = Omit<ComponentPropsWithoutRef<"section">, "title"> & {
  description?: ReactNode;
  kind: StateBannerKind;
  meta?: ReactNode;
  title: ReactNode;
};

export function StateBanner({ className, description, kind, meta, title, ...rest }: Props) {
  const signal = STATE_SIGNALS[kind];
  const bannerClassName = className ? `state-banner ${className}` : "state-banner";

  return (
    <SectionPanel
      className={bannerClassName}
      data-kind={kind}
      description={description}
      eyebrow="Runtime state"
      meta={meta}
      signal={<SignalPill className="state-banner-signal" label={signal.label} tone={signal.tone} />}
      title={title}
      {...rest}
    />
  );
}
