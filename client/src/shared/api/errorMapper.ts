import type { ApiError } from "./apiClient";

export const errorMapper = (error: ApiError): string[] => {
  const errors = error.errors;
  return errors.map((error) => error.detail);
};
