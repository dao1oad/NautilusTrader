import type { ReactNode } from "react";


type PageStateKind = "loading" | "empty" | "error" | "stale";

const STATE_KICKERS: Record<PageStateKind, string> = {
  loading: "Loading",
  empty: "No data",
  error: "Error",
  stale: "Stale"
};

type Props = {
  kind: PageStateKind;
  title: string;
  description?: string;
  meta?: ReactNode;
};

export function PageState({ kind, title, description, meta }: Props) {
  return (
    <section className="page-state" data-kind={kind}>
      <p className="page-state-kicker">{STATE_KICKERS[kind]}</p>
      <h2>{title}</h2>
      {description ? <p className="page-state-copy">{description}</p> : null}
      {meta ? <div className="page-state-meta">{meta}</div> : null}
    </section>
  );
}
