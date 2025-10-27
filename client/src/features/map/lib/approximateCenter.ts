import type { LatLng } from "@/entities/geodata";
import polylabel from "polylabel";

export const findApproximatePolygonCenter = (coords: LatLng[]) => {
  const [lat, lng] = polylabel(
    [coords.map(({ lat, lng }) => [lat, lng])],
    0.0000001,
  );
  return { lat, lng } as LatLng;
};
