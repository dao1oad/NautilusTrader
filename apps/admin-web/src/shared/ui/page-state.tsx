import type { ReactNode } from "react";

import { StateBanner } from "./state-banner";

type PageStateKind = "loading" | "empty" | "error" | "stale";

type Props = {
  kind: PageStateKind;
  title: string;
  description?: string;
  meta?: ReactNode;
};

export function PageState({ kind, title, description, meta }: Props) {
  return (
    <StateBanner className="page-state" description={description} kind={kind} meta={meta} title={title} />
  );
}
