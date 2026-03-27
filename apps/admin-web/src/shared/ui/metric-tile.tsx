import type { ComponentPropsWithoutRef, ReactNode } from "react";

import type { SignalTone } from "./signal-pill";


type Props = Omit<ComponentPropsWithoutRef<"section">, "title"> & {
  detail?: ReactNode;
  label: ReactNode;
  meta?: ReactNode;
  tone?: SignalTone;
  value: ReactNode;
};

export function MetricTile({ className, detail, label, meta, tone = "neutral", value, ...rest }: Props) {
  const tileClassName = className ? `metric-tile ${className}` : "metric-tile";

  return (
    <section className={tileClassName} data-tone={tone} {...rest}>
      <p className="metric-tile-label">{label}</p>
      <strong className="metric-tile-value">{value}</strong>
      {meta ? <div className="metric-tile-meta">{meta}</div> : null}
      {detail ? <p className="metric-tile-detail">{detail}</p> : null}
    </section>
  );
}
