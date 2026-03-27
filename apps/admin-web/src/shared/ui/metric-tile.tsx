import type { ComponentPropsWithoutRef, ReactNode } from "react";

import type { SignalTone } from "./signal-pill";


type Props = Omit<ComponentPropsWithoutRef<"section">, "title"> & {
  detail?: ReactNode;
  label: ReactNode;
  tone?: SignalTone;
  value: ReactNode;
};

export function MetricTile({ className, detail, label, tone = "neutral", value, ...rest }: Props) {
  const tileClassName = className ? `metric-tile ${className}` : "metric-tile";

  return (
    <section className={tileClassName} data-tone={tone} {...rest}>
      <p className="metric-tile-label">{label}</p>
      <strong className="metric-tile-value">{value}</strong>
      {detail ? <p className="metric-tile-detail">{detail}</p> : null}
    </section>
  );
}
