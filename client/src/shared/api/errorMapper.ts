import type { ApiError } from "./apiClient";

export const errorMapper = (error: ApiError | Error): string[] => {
  if ("errors" in error) {
    return error.errors.map((error) => error.detail);
  }

  return ["Oops! Something went wrong. Try again later :)"];
};
