import type { ApiError } from "./apiClient";

declare module "@tanstack/react-query" {
  interface Register {
    defaultError: ApiError;
  }
}
