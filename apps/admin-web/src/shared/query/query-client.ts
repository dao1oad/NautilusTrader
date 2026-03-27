import { QueryClient } from "@tanstack/react-query";


export const adminQueryKeys = {
  overview: () => ["admin", "overview"] as const,
  nodes: () => ["admin", "nodes"] as const,
  strategies: () => ["admin", "strategies"] as const,
  adapters: () => ["admin", "adapters"] as const,
  audit: () => ["admin", "audit"] as const,
  config: () => ["admin", "config"] as const,
  orders: (limit: number) => ["admin", "orders", limit] as const,
  fills: (limit: number) => ["admin", "fills", limit] as const,
  positions: (limit: number) => ["admin", "positions", limit] as const,
  accounts: (limit: number) => ["admin", "accounts", limit] as const,
  risk: () => ["admin", "risk"] as const,
  logs: (limit: number) => ["admin", "logs", limit] as const,
  catalog: (limit: number, startTime: string, endTime: string) =>
    ["admin", "catalog", limit, startTime, endTime] as const,
  playback: (limit: number, startTime: string, endTime: string) =>
    ["admin", "playback", limit, startTime, endTime] as const,
  diagnostics: () => ["admin", "diagnostics"] as const,
  backtests: (limit: number) => ["admin", "backtests", limit] as const,
  reports: (limit: number) => ["admin", "reports", limit] as const
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false
    }
  }
});
