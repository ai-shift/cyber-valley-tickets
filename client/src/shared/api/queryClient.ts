import { QueryClient, QueryCache } from "@tanstack/react-query";
import type { ApiError } from "./apiClient";
import { errorMapper } from "./errorMapper";

declare module "@tanstack/react-query" {
  interface Register {
    defaultError: ApiError;
  }
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      return errorMapper(error);
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});
