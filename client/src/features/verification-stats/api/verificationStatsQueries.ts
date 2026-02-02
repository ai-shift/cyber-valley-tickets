import { apiClient } from "@/shared/api";
import { queryOptions } from "@tanstack/react-query";

const getVerificationStats = async () => {
  const response = await apiClient.GET("/api/events/verification-stats");
  return response;
};

export const verificationStatsQueries = {
  stats: () =>
    queryOptions({
      queryKey: ["verification", "stats"],
      queryFn: getVerificationStats,
      select: (data) => data.data,
    }),
};
