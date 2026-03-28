import { useQuery } from "@tanstack/react-query";

import { getLogsSnapshot, READ_ONLY_DEFAULT_LIMIT } from "../../shared/api/admin-client";
import { adminQueryKeys } from "../../shared/query/query-client";
import type { LogSummary } from "../../shared/types/admin";
import { AdminListPage } from "../read-only/admin-list-page";


const LOG_COLUMNS = [
  {
    header: "Time",
    render: (log: LogSummary) => log.timestamp
  },
  {
    header: "Level",
    render: (log: LogSummary) => log.level
  },
  {
    header: "Component",
    render: (log: LogSummary) => log.component
  },
  {
    header: "Message",
    render: (log: LogSummary) => log.message
  }
] as const;

export function LogsPage() {
  const query = useQuery({
    queryKey: adminQueryKeys.logs(READ_ONLY_DEFAULT_LIMIT),
    queryFn: () => getLogsSnapshot(READ_ONLY_DEFAULT_LIMIT)
  });

  return (
    <AdminListPage
      columns={LOG_COLUMNS}
      emptyDescription="No logs are currently reported by the admin API."
      getRowKey={(log, index) => `${log.timestamp}:${log.component}:${index}`}
      loadingDescription="Loading the latest operational logs."
      query={query}
      summaryCopy="Operational log lines from the latest bounded runtime window, ordered for rapid operator scan."
      tableLabel="Logs"
      title="Logs"
    />
  );
}
