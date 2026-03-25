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

export type AccountSummary = {
  account_id: string;
  status: string;
};

export type PositionSummary = {
  instrument_id: string;
  side: "long" | "short" | "flat";
  quantity: string;
};

export type LogSummary = {
  timestamp: string;
  level: "DEBUG" | "INFO" | "WARN" | "ERROR";
  component: string;
  message: string;
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
export type PositionsSnapshot = BoundedAdminListSnapshot<PositionSummary>;
export type AccountsSnapshot = BoundedAdminListSnapshot<AccountSummary>;
export type LogsSnapshot = BoundedAdminListSnapshot<LogSummary>;

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

export type AdminEvent =
  | { type: "subscribed"; channels: string[] }
  | { type: "connection.state"; state: ConnectionState }
  | { type: "overview.updated" }
  | { type: "snapshot.invalidate" }
  | { type: "server.error"; code: string; channels?: string[]; message?: string };
