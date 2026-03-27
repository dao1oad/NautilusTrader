import type { ComponentPropsWithoutRef, ReactNode } from "react";


export type SignalTone = "neutral" | "info" | "positive" | "warning" | "danger";

type Props = ComponentPropsWithoutRef<"div"> & {
  label: ReactNode;
  detail?: ReactNode;
  tone?: SignalTone;
};

export function SignalPill({ className, detail, label, tone = "neutral", ...rest }: Props) {
  const pillClassName = className ? `signal-pill ${className}` : "signal-pill";

  return (
    <div className={pillClassName} data-tone={tone} {...rest}>
      <span className="signal-pill-label">{label}</span>
      {detail ? <span className="signal-pill-detail">{detail}</span> : null}
    </div>
  );
}
