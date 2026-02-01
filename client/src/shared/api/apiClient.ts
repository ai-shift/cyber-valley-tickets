import createClient, { type Middleware } from "openapi-fetch";
import { useAuthSlice } from "@/app/providers/authProvider/model/authSlice";
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
  baseUrl: import.meta.env.PUBLIC_API_HOST,
});

let refreshPromise: Promise<Response> | null = null;

const refreshSessionIfNeeded = async (request: Request) => {
  if (request.url.includes("/api/auth/refresh")) {
    return;
  }
  const { hasJWT, signatureExpiresAt, signatureRefreshAt, logout } =
    useAuthSlice.getState();
  if (!hasJWT) return;

  const now = Math.floor(Date.now() / 1000);
  if (signatureExpiresAt && now > signatureExpiresAt) {
    logout();
    return;
  }
  if (signatureRefreshAt && now >= signatureRefreshAt) {
    if (!refreshPromise) {
      const refreshUrl = new URL(
        "/api/auth/refresh",
        import.meta.env.PUBLIC_API_HOST,
      ).toString();
      refreshPromise = fetch(refreshUrl, {
        credentials: "include",
      }).finally(() => {
        refreshPromise = null;
      });
    }
    await refreshPromise;
  }
};

const errorMiddleware: Middleware = {
  async onRequest({ request }) {
    await refreshSessionIfNeeded(request);
    return request;
  },
  async onResponse({ response }) {
    if (!response.ok) {
      const errorData = await response.json();
      throw errorData as ApiError;
    }
  },
};

apiClient.use(errorMiddleware);
