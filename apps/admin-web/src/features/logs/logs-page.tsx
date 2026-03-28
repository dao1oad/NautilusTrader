import { useQuery } from "@tanstack/react-query";

import { getLogsSnapshot, READ_ONLY_DEFAULT_LIMIT } from "../../shared/api/admin-client";
import { useI18n } from "../../shared/i18n/use-i18n";
import { adminQueryKeys } from "../../shared/query/query-client";
import type { LogSummary } from "../../shared/types/admin";
import { AdminListPage } from "../read-only/admin-list-page";


type LogsTranslator = ReturnType<typeof useI18n>["t"];

function buildLogColumns(t: LogsTranslator) {
  return [
    {
      header: t("pages.logs.columns.time"),
      render: (log: LogSummary) => log.timestamp
    },
    {
      header: t("pages.logs.columns.level"),
      render: (log: LogSummary) => log.level
    },
    {
      header: t("pages.logs.columns.component"),
      render: (log: LogSummary) => log.component
    },
    {
      header: t("pages.logs.columns.message"),
      render: (log: LogSummary) => log.message
    }
  ] as const;
}

export function LogsPage() {
  const { t } = useI18n();
  const query = useQuery({
    queryKey: adminQueryKeys.logs(READ_ONLY_DEFAULT_LIMIT),
    queryFn: () => getLogsSnapshot(READ_ONLY_DEFAULT_LIMIT)
  });

  return (
    <AdminListPage
      columns={buildLogColumns(t)}
      emptyDescription={t("pages.logs.emptyDescription")}
      getRowKey={(log, index) => `${log.timestamp}:${log.component}:${index}`}
      loadingDescription={t("pages.logs.loadingDescription")}
      query={query}
      summaryCopy={t("pages.logs.summaryCopy")}
      tableLabel={t("pages.logs.tableLabel")}
      title={t("pages.logs.title")}
    />
  );
}
