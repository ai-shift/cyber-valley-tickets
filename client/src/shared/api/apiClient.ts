import createClient from "openapi-fetch";
import type { paths } from "./apiTypes";

export const apiClient = createClient<paths>({
  baseUrl: "http://localhost:5173/",
});
