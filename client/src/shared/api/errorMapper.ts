import type { EthersError } from "ethers";
import type { ApiError } from "./apiClient";

export const errorMapper = (error: ApiError | EthersError): string[] => {
  if ("shortMessage" in error) {
    return [error.shortMessage];
  }

  if ("errorrs" in error) return error.errors.map((error) => error.detail);

  return ["Oops! Something went wrong. Try again later :)"];
};
