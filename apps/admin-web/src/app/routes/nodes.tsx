import { PageState } from "../../shared/ui/page-state";


export function NodesRoutePage() {
  return (
    <PageState
      kind="empty"
      title="Nodes"
      description="Read-only node inventory and lifecycle diagnostics land in the next Phase 1 slice."
    />
  );
}
