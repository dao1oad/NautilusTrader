export type NodeStatus = "not_configured" | "running" | "stopped" | "error";

export type ConnectionState = "connected" | "connecting" | "disconnected" | "stale";

export type NodeSummary = {
  status: NodeStatus;
  node_id: string | null;
};

export type StrategySummary = {
  strategy_id: string;
  status: string;
};

export type AdapterSummary = {
  adapter_id: string;
  status: string;
};

export type OrderSummary = {
  client_order_id: string;
  instrument_id: string;
  side: "buy" | "sell";
  quantity: string;
  status: string;
};

export type FillSummary = {
  fill_id: string;
  client_order_id: string;
  instrument_id: string;
  side: "buy" | "sell";
  quantity: string;
  price: string;
  liquidity_side: string;
  timestamp: string;
};

export type AccountsSummary = {
  active_accounts: number;
  total_equity: string;
  available_cash: string;
  margin_used: string;
  margin_available: string;
  gross_exposure: string;
  net_exposure: string;
};

export type AccountBalanceSummary = {
  asset: string;
  total: string;
  available: string;
  locked: string;
};

export type AccountExposureSummary = {
  instrument_id: string;
  side: "long" | "short" | "flat";
  net_quantity: string;
  notional: string;
  leverage: string;
};

export type AccountSummary = {
  account_id: string;
  venue?: string | null;
  account_type?: string | null;
  status: string;
  base_currency?: string | null;
  total_equity?: string | null;
  available_cash?: string | null;
  margin_used?: string | null;
  margin_available?: string | null;
  margin_ratio?: string | null;
  gross_exposure?: string | null;
  net_exposure?: string | null;
  updated_at?: string | null;
  balances: AccountBalanceSummary[];
  exposures: AccountExposureSummary[];
  alerts: string[];
};

export type RiskSummary = {
  trading_state: string;
  risk_level: string;
  margin_utilization: string;
  exposure_utilization: string;
  active_alerts: number;
  blocked_actions: number;
};

export type RiskEvent = {
  event_id: string;
  severity: "info" | "warn" | "critical";
  title: string;
  message: string;
  occurred_at: string;
};

export type RiskBlock = {
  block_id: string;
  scope: string;
  reason: string;
  status: "active" | "cleared";
  raised_at: string;
};

export type PositionSummary = {
  position_id?: string | null;
  instrument_id: string;
  side: "long" | "short" | "flat";
  quantity: string;
  entry_price?: string | null;
  unrealized_pnl?: string | null;
  realized_pnl?: string | null;
  opened_at?: string | null;
  updated_at?: string | null;
};

export type LogSummary = {
  timestamp: string;
  level: "DEBUG" | "INFO" | "WARN" | "ERROR";
  component: string;
  message: string;
};

export type CatalogEntry = {
  catalog_id: string;
  instrument_id: string;
  data_type: "bars" | "trades" | "quotes";
  timeframe: string;
  status: "ready" | "warming" | "delayed";
  row_count: number;
  first_record_at: string;
  last_record_at: string;
};

export type HistoryQuery = {
  catalog_id: string;
  instrument_id: string;
  data_type: "bars" | "trades" | "quotes";
  start_time: string;
  end_time: string;
  limit: number;
  returned_rows: number;
  feedback: string;
};

export type PlaybackRequest = {
  request_id: string;
  catalog_id: string;
  instrument_id: string;
  start_time: string;
  end_time: string;
  limit: number;
  speed: string;
  event_types: string[];
  feedback: string;
};

export type PlaybackTimelinePoint = {
  timestamp: string;
  mid_price: string;
  cumulative_events: number;
};

export type PlaybackEventSummary = {
  timestamp: string;
  event_type: string;
  summary: string;
};

export type DiagnosticsSummary = {
  overall_status: "healthy" | "degraded" | "partial";
  healthy_links: number;
  degraded_links: number;
  slow_queries: number;
  latest_catalog_sync_at: string;
};

export type LinkHealth = {
  link_id: string;
  label: string;
  status: "healthy" | "degraded";
  latency_ms: number;
  last_checked_at: string;
  detail: string;
};

export type QueryTiming = {
  query_id: string;
  surface: "catalog" | "playback" | "diagnostics";
  status: "ok" | "slow" | "failed";
  limit: number;
  window_start: string;
  window_end: string;
  returned_rows: number;
  duration_ms: number;
  detail: string;
};

export type CommandErrorCode =
  | "invalid_request"
  | "not_found"
  | "conflict"
  | "not_supported"
  | "unavailable"
  | "internal_error";

export type CommandFailure = {
  code: CommandErrorCode;
  message: string;
  retryable: boolean;
  details: Record<string, unknown>;
};

export type CommandReceiptStatus = "accepted" | "completed" | "failed";

export type CommandReceipt = {
  command_id: string;
  command: string;
  target: string;
  status: CommandReceiptStatus;
  recorded_at: string;
  message: string | null;
  failure: CommandFailure | null;
};

export type AuditRecord = {
  sequence_id: number;
  command_id: string;
  command: string;
  target: string | null;
  status: CommandReceiptStatus;
  payload: Record<string, unknown>;
  recorded_at: string;
  message: string | null;
  failure: CommandFailure | null;
};

export type SectionError = {
  section: string;
  message: string;
};

export type AdminListSnapshot<T> = {
  generated_at: string;
  partial: boolean;
  items: T[];
  errors: SectionError[];
};

export type NodesSnapshot = AdminListSnapshot<NodeSummary>;
export type StrategiesSnapshot = AdminListSnapshot<StrategySummary>;
export type AdaptersSnapshot = AdminListSnapshot<AdapterSummary>;
export type BoundedAdminListSnapshot<T> = AdminListSnapshot<T> & { limit: number };
export type OrdersSnapshot = BoundedAdminListSnapshot<OrderSummary>;
export type FillsSnapshot = BoundedAdminListSnapshot<FillSummary>;
export type PositionsSnapshot = BoundedAdminListSnapshot<PositionSummary>;
export type AccountsSnapshot = BoundedAdminListSnapshot<AccountSummary> & { summary: AccountsSummary };
export type LogsSnapshot = BoundedAdminListSnapshot<LogSummary>;
export type CatalogSnapshot = BoundedAdminListSnapshot<CatalogEntry> & {
  history_query: HistoryQuery;
  operator_notes: string[];
};
export type AuditSnapshot = AdminListSnapshot<AuditRecord>;
export type RiskSnapshot = {
  generated_at: string;
  summary: RiskSummary;
  partial: boolean;
  events: RiskEvent[];
  blocks: RiskBlock[];
  errors: SectionError[];
};
export type PlaybackSnapshot = {
  generated_at: string;
  request: PlaybackRequest;
  partial: boolean;
  timeline: PlaybackTimelinePoint[];
  events: PlaybackEventSummary[];
  operator_notes: string[];
  errors: SectionError[];
};
export type DiagnosticsSnapshot = {
  generated_at: string;
  summary: DiagnosticsSummary;
  partial: boolean;
  links: LinkHealth[];
  query_timings: QueryTiming[];
  errors: SectionError[];
};

export type ConfigDiffEntry = {
  key: string;
  summary: string;
  desired: string;
  actual: string;
  status: "in_sync" | "drifted";
  runbook_id: string | null;
};

export type RecoveryRunbook = {
  runbook_id: string;
  title: string;
  summary: string;
  steps: string[];
};

export type ConfigDiffSnapshot = {
  generated_at: string;
  items: ConfigDiffEntry[];
  runbooks: RecoveryRunbook[];
};

export type OverviewSnapshot = {
  generated_at: string;
  stale: boolean;
  partial: boolean;
  node: NodeSummary;
  strategies: StrategySummary[];
  adapters: AdapterSummary[];
  accounts: AccountSummary[];
  positions: PositionSummary[];
  errors: SectionError[];
};

export type CommandEvent =
  | { type: "command.accepted"; receipt: CommandReceipt }
  | { type: "command.completed"; receipt: CommandReceipt }
  | { type: "command.failed"; receipt: CommandReceipt };

export type AdminEvent =
  | CommandEvent
  | { type: "subscribed"; channels: string[] }
  | { type: "connection.state"; state: ConnectionState }
  | { type: "overview.updated" }
  | { type: "snapshot.invalidate" }
  | { type: "server.error"; code: string; channels?: string[]; message?: string };
