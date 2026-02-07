import { useAuthSlice } from "@/app/providers/authProvider/model/authSlice";
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
  baseUrl: import.meta.env.PUBLIC_API_HOST,
});

const addressMiddleware: Middleware = {
  async onRequest({ request }) {
    const address = useAuthSlice.getState().address;
    // Always include cookies (trusted-wallet cookie) on API requests.
    const reqWithCreds = new Request(request, { credentials: "include" });
    if (!address) return reqWithCreds;

    const headers = new Headers(reqWithCreds.headers);
    headers.set("X-User-Address", address);
    return new Request(reqWithCreds, { headers });
  },
};

const errorMiddleware: Middleware = {
  async onResponse({ response }) {
    if (!response.ok) {
      try {
        const errorData = (await response.json()) as ApiError;
        throw errorData;
      } catch {
        throw {
          type: "parse_error",
          errors: [
            {
              code: "parse_error",
              detail: `HTTP ${response.status}`,
              attr: null,
            },
          ],
        } as unknown as ApiError;
      }
    }
  },
};

apiClient.use(addressMiddleware);
apiClient.use(errorMiddleware);
