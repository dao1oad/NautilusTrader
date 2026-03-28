import { useQuery } from "@tanstack/react-query";

import { getNodesSnapshot } from "../../shared/api/admin-client";
import { useI18n } from "../../shared/i18n/use-i18n";
import { adminQueryKeys } from "../../shared/query/query-client";
import type { NodeSummary } from "../../shared/types/admin";
import { AdminListPage } from "../read-only/admin-list-page";

type NodesTranslator = ReturnType<typeof useI18n>["t"];

function buildNodeColumns(t: NodesTranslator) {
  return [
    {
      header: t("pages.nodes.columns.node"),
      render: (node: NodeSummary) => node.node_id ?? t("pages.nodes.unassigned")
    },
    {
      header: t("pages.nodes.columns.status"),
      render: (node: NodeSummary) => node.status
    }
  ] as const;
}

export function NodesPage() {
  const { t } = useI18n();
  const query = useQuery({
    queryKey: adminQueryKeys.nodes(),
    queryFn: getNodesSnapshot
  });

  return (
    <AdminListPage
      columns={buildNodeColumns(t)}
      emptyDescription={t("pages.nodes.emptyDescription")}
      getRowKey={(node, index) => node.node_id ?? `node-${index}`}
      loadingDescription={t("pages.nodes.loadingDescription")}
      query={query}
      summaryCopy={t("pages.nodes.summaryCopy")}
      tableLabel={t("pages.nodes.tableLabel")}
      title={t("pages.nodes.title")}
    />
  );
}
