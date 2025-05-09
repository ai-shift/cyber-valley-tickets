import createClient, { type Middleware } from "openapi-fetch";
import type { components, paths } from "./apiTypes";

export type ApiError = components["schemas"][
  | "ParseErrorResponse"
  | "ErrorResponse401"
  | "ErrorResponse404"
  | "ErrorResponse405"
  | "ErrorResponse406"
  | "ErrorResponse415"
  | "ErrorResponse500"];

export const apiClient = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_HOST,
});

const errorMiddleware: Middleware = {
  async onResponse({ response }) {
    if (!response.ok) {
      const errorData = await response.json();
      throw errorData as ApiError;
    }
  },
};

apiClient.use(errorMiddleware);
