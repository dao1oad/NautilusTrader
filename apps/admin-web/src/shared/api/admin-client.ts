import type {
  AccountsSnapshot,
  AdaptersSnapshot,
  AuditSnapshot,
  CatalogSnapshot,
  CommandReceipt,
  ConfigDiffSnapshot,
  DiagnosticsSnapshot,
  FillsSnapshot,
  LogsSnapshot,
  NodesSnapshot,
  OrdersSnapshot,
  OverviewSnapshot,
  PlaybackSnapshot,
  PositionsSnapshot,
  RiskSnapshot,
  StrategiesSnapshot
} from "../types/admin";


export const READ_ONLY_DEFAULT_LIMIT = 100;
export const CATALOG_DEFAULT_START_TIME = "2026-03-27T07:00:00Z";
export const CATALOG_DEFAULT_END_TIME = "2026-03-27T09:00:00Z";
export const PLAYBACK_DEFAULT_START_TIME = "2026-03-27T07:30:00Z";
export const PLAYBACK_DEFAULT_END_TIME = "2026-03-27T08:00:00Z";


function buildLimitedPath(path: string, limit: number): string {
  return `${path}?limit=${limit}`;
}


function buildBoundedPath(
  path: string,
  params: Record<string, string | number>,
): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    searchParams.set(key, String(value));
  }

  return `${path}?${searchParams.toString()}`;
}


async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Admin request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}


export async function getHealthStatus(): Promise<{ status: string }> {
  const response = await fetch("/api/admin/health");
  return parseJson<{ status: string }>(response);
}


export async function getOverviewSnapshot(): Promise<OverviewSnapshot> {
  const response = await fetch("/api/admin/overview");
  return parseJson<OverviewSnapshot>(response);
}


export async function getNodesSnapshot(): Promise<NodesSnapshot> {
  const response = await fetch("/api/admin/nodes");
  return parseJson<NodesSnapshot>(response);
}


export async function getStrategiesSnapshot(): Promise<StrategiesSnapshot> {
  const response = await fetch("/api/admin/strategies");
  return parseJson<StrategiesSnapshot>(response);
}


export async function getAdaptersSnapshot(): Promise<AdaptersSnapshot> {
  const response = await fetch("/api/admin/adapters");
  return parseJson<AdaptersSnapshot>(response);
}


export async function getOrdersSnapshot(limit: number = READ_ONLY_DEFAULT_LIMIT): Promise<OrdersSnapshot> {
  const response = await fetch(buildLimitedPath("/api/admin/orders", limit));
  return parseJson<OrdersSnapshot>(response);
}

export async function getFillsSnapshot(limit: number = READ_ONLY_DEFAULT_LIMIT): Promise<FillsSnapshot> {
  const response = await fetch(buildLimitedPath("/api/admin/fills", limit));
  return parseJson<FillsSnapshot>(response);
}


export async function getPositionsSnapshot(limit: number = READ_ONLY_DEFAULT_LIMIT): Promise<PositionsSnapshot> {
  const response = await fetch(buildLimitedPath("/api/admin/positions", limit));
  return parseJson<PositionsSnapshot>(response);
}


export async function getAccountsSnapshot(limit: number = READ_ONLY_DEFAULT_LIMIT): Promise<AccountsSnapshot> {
  const response = await fetch(buildLimitedPath("/api/admin/accounts", limit));
  return parseJson<AccountsSnapshot>(response);
}


export async function getRiskSnapshot(): Promise<RiskSnapshot> {
  const response = await fetch("/api/admin/risk");
  return parseJson<RiskSnapshot>(response);
}


export async function getLogsSnapshot(limit: number = READ_ONLY_DEFAULT_LIMIT): Promise<LogsSnapshot> {
  const response = await fetch(buildLimitedPath("/api/admin/logs", limit));
  return parseJson<LogsSnapshot>(response);
}


export async function getCatalogSnapshot(
  limit: number = READ_ONLY_DEFAULT_LIMIT,
  startTime: string = CATALOG_DEFAULT_START_TIME,
  endTime: string = CATALOG_DEFAULT_END_TIME,
): Promise<CatalogSnapshot> {
  const response = await fetch(
    buildBoundedPath("/api/admin/catalog", {
      limit,
      start_time: startTime,
      end_time: endTime
    })
  );
  return parseJson<CatalogSnapshot>(response);
}


export async function getPlaybackSnapshot(
  limit: number = READ_ONLY_DEFAULT_LIMIT,
  startTime: string = PLAYBACK_DEFAULT_START_TIME,
  endTime: string = PLAYBACK_DEFAULT_END_TIME,
): Promise<PlaybackSnapshot> {
  const response = await fetch(
    buildBoundedPath("/api/admin/playback", {
      limit,
      start_time: startTime,
      end_time: endTime
    })
  );
  return parseJson<PlaybackSnapshot>(response);
}


export async function getDiagnosticsSnapshot(): Promise<DiagnosticsSnapshot> {
  const response = await fetch("/api/admin/diagnostics");
  return parseJson<DiagnosticsSnapshot>(response);
}


async function postCommand(path: string): Promise<CommandReceipt> {
  const response = await fetch(path, {
    method: "POST"
  });
  return parseJson<CommandReceipt>(response);
}


export async function startStrategyCommand(strategyId: string): Promise<CommandReceipt> {
  return postCommand(`/api/admin/commands/strategies/${strategyId}/start`);
}


export async function stopStrategyCommand(strategyId: string): Promise<CommandReceipt> {
  return postCommand(`/api/admin/commands/strategies/${strategyId}/stop`);
}


export async function connectAdapterCommand(adapterId: string): Promise<CommandReceipt> {
  return postCommand(`/api/admin/commands/adapters/${adapterId}/connect`);
}


export async function disconnectAdapterCommand(adapterId: string): Promise<CommandReceipt> {
  return postCommand(`/api/admin/commands/adapters/${adapterId}/disconnect`);
}


export async function getAuditSnapshot(): Promise<AuditSnapshot> {
  const response = await fetch("/api/admin/audit");
  return parseJson<AuditSnapshot>(response);
}


export async function getConfigDiffSnapshot(): Promise<ConfigDiffSnapshot> {
  const response = await fetch("/api/admin/config/diff");
  return parseJson<ConfigDiffSnapshot>(response);
}
