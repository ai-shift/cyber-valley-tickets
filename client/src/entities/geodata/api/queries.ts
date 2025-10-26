import { apiClient } from "@/shared/api";

export const getGeodataLayer = async (layerName: string) =>
  await apiClient.GET("/api/geodata/{name}/", {
    params: {
      path: {
        name: layerName,
      },
    },
  });
