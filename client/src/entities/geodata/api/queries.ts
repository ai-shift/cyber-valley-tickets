import { apiClient } from "@/shared/api";

export const getGeodataLayer = async (layerName: string) =>
  await apiClient.GET("/api/geodata/{id}/", {
    params: {
      path: {
        id: layerName,
      },
    },
  });

export const getGeodata = async () => await apiClient.GET("/api/geodata/");
