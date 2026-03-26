import { QueryClient } from "@tanstack/react-query";


export const adminQueryKeys = {
  overview: () => ["admin", "overview"] as const,
  nodes: () => ["admin", "nodes"] as const,
  strategies: () => ["admin", "strategies"] as const,
  adapters: () => ["admin", "adapters"] as const,
  audit: () => ["admin", "audit"] as const,
  config: () => ["admin", "config"] as const,
  orders: (limit: number) => ["admin", "orders", limit] as const,
  positions: (limit: number) => ["admin", "positions", limit] as const,
  accounts: (limit: number) => ["admin", "accounts", limit] as const,
  logs: (limit: number) => ["admin", "logs", limit] as const
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false
    }
  }
});
