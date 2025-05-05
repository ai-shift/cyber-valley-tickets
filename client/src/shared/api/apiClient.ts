import createClient, { type Middleware } from "openapi-fetch";
import type { components, paths } from "./apiTypes";

export type ApiError = components["schemas"]["ParseErrorResponse"];

export const apiClient = createClient<paths>({
  baseUrl: "http://localhost:5173/",
});

const errorMiddleware: Middleware = {
  async onResponse({ request, response, options }) {
    if (!response.ok) {
      const errorData = await response.json();
      throw errorData as ApiError;
    }
  },
};

apiClient.use(errorMiddleware);
