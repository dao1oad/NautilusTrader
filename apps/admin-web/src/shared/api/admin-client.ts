import type {
  AccountsSnapshot,
  AdaptersSnapshot,
  AuditSnapshot,
  CommandReceipt,
  ConfigDiffSnapshot,
  LogsSnapshot,
  NodesSnapshot,
  OrdersSnapshot,
  OverviewSnapshot,
  PositionsSnapshot,
  StrategiesSnapshot
} from "../types/admin";


export const READ_ONLY_DEFAULT_LIMIT = 100;


function buildLimitedPath(path: string, limit: number): string {
  return `${path}?limit=${limit}`;
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


export async function getPositionsSnapshot(limit: number = READ_ONLY_DEFAULT_LIMIT): Promise<PositionsSnapshot> {
  const response = await fetch(buildLimitedPath("/api/admin/positions", limit));
  return parseJson<PositionsSnapshot>(response);
}


export async function getAccountsSnapshot(limit: number = READ_ONLY_DEFAULT_LIMIT): Promise<AccountsSnapshot> {
  const response = await fetch(buildLimitedPath("/api/admin/accounts", limit));
  return parseJson<AccountsSnapshot>(response);
}


export async function getLogsSnapshot(limit: number = READ_ONLY_DEFAULT_LIMIT): Promise<LogsSnapshot> {
  const response = await fetch(buildLimitedPath("/api/admin/logs", limit));
  return parseJson<LogsSnapshot>(response);
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
