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

export type AccountSummary = {
  account_id: string;
  status: string;
};

export type PositionSummary = {
  instrument_id: string;
  side: "long" | "short" | "flat";
  quantity: string;
};

export type SectionError = {
  section: string;
  message: string;
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

export type AdminEvent =
  | { type: "subscribed"; channels: string[] }
  | { type: "connection.state"; state: ConnectionState }
  | { type: "overview.updated" }
  | { type: "snapshot.invalidate" }
  | { type: "server.error"; code: string; channels?: string[]; message?: string };
