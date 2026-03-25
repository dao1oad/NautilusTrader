import { QueryClient } from "@tanstack/react-query";


export const adminQueryKeys = {
  overview: () => ["admin", "overview"] as const,
  nodes: () => ["admin", "nodes"] as const,
  strategies: () => ["admin", "strategies"] as const,
  adapters: () => ["admin", "adapters"] as const
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false
    }
  }
});
