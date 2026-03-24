import { QueryClient } from "@tanstack/react-query";


export const adminQueryKeys = {
  overview: () => ["admin", "overview"] as const
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false
    }
  }
});
