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

export type AccountSummary = {
  account_id: string;
  status: string;
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
export type AccountsSnapshot = BoundedAdminListSnapshot<AccountSummary>;
export type LogsSnapshot = BoundedAdminListSnapshot<LogSummary>;
export type AuditSnapshot = AdminListSnapshot<AuditRecord>;

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
