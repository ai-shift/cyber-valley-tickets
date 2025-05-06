import type { ApiError } from "./apiClient";
import type { EthersError } from "ethers";

export const errorMapper = (error: ApiError | EthersError): string[] => {
  if ("shortMessage" in error) {
    return [error.shortMessage];
  }

  return error.errors.map((error) => error.detail);
};
