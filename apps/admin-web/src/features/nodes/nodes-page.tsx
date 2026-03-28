import { useQuery } from "@tanstack/react-query";

import { getNodesSnapshot } from "../../shared/api/admin-client";
import { adminQueryKeys } from "../../shared/query/query-client";
import type { NodeSummary } from "../../shared/types/admin";
import { AdminListPage } from "../read-only/admin-list-page";


const NODE_COLUMNS = [
  {
    header: "Node",
    render: (node: NodeSummary) => node.node_id ?? "Unassigned"
  },
  {
    header: "Status",
    render: (node: NodeSummary) => node.status
  }
] as const;

export function NodesPage() {
  const query = useQuery({
    queryKey: adminQueryKeys.nodes(),
    queryFn: getNodesSnapshot
  });

  return (
    <AdminListPage
      columns={NODE_COLUMNS}
      emptyDescription="No nodes are currently reported by the admin API."
      getRowKey={(node, index) => node.node_id ?? `node-${index}`}
      loadingDescription="Loading the latest node diagnostics."
      query={query}
      summaryCopy="Runtime node identity, assignment, and process status from the latest admin snapshot."
      tableLabel="Nodes"
      title="Nodes"
    />
  );
}
