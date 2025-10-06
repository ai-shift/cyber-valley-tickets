import { AdvancedMarker, Map as GMap } from "@vis.gl/react-google-maps";
import { Polygon } from "../ui/components/polygon.tsx";
import { Polyline } from "../ui/components/polyline.tsx";

import type { Placemark as PlacemarkType } from "../model/types.ts";

import { truncateColorString } from "../lib/colorTruncator.ts";

import bpn_data from "@/data/geodata/bpn_data.json";
import bridge from "@/data/geodata/bridge.json";
import districts from "@/data/geodata/districts.json";
import dots from "@/data/geodata/dots.json";
import leasehold from "@/data/geodata/leasehold.json";
import lots from "@/data/geodata/lots.json";
import objects from "@/data/geodata/objects.json";
import paths from "@/data/geodata/paths.json";
import regions from "@/data/geodata/regions.json";
import { useState } from "react";

const geodata = {
  "Bpn data": bpn_data,
  Bridge: bridge,
  Districts: districts,
  Dots: dots,
  Leasehold: leasehold,
  Lots: lots,
  Objects: objects,
  Path: paths,
  Regions: regions,
};

type GeodataKeys = keyof typeof geodata;

export const EbaliMap: React.FC = () => {
  const [displayed, setDisplayed] = useState<GeodataKeys[]>([]);

  return (
    <div>
      <div className="flex flex-col py-3">
        {Object.keys(geodata).map((key) => (
          <label key={key} className="flex gap-3 text-xl">
            <input
              type="checkbox"
              checked={displayed.includes(key as GeodataKeys)}
              onChange={() => {
                if (displayed.includes(key as GeodataKeys)) {
                  setDisplayed((prev) => prev.filter((el) => el !== key));
                } else {
                  setDisplayed((prev) => [...prev, key as GeodataKeys]);
                }
              }}
            />
            {key}
          </label>
        ))}
      </div>

      <GMap
        style={{ width: "full", height: "500px" }}
        mapId="fb99876bf33e90419a932304"
        defaultCenter={{ lat: -8.2980705, lng: 115.088186 }}
        defaultZoom={16}
        gestureHandling="greedy"
        colorScheme="DARK"
        disableDefaultUI
      >
        {displayed.map((layer) =>
          geodata[layer].map((placemark, idx) => (
            <Placemark
              key={`${placemark.name}-${idx}`}
              placemark={placemark as PlacemarkType}
            />
          )),
        )}
      </GMap>
    </div>
  );
};

type PlacemarkProps = {
  placemark: PlacemarkType;
};

const Placemark: React.FC<PlacemarkProps> = ({ placemark }) => {
  switch (placemark.type) {
    case "point":
      return (
        <AdvancedMarker position={placemark.coordinates}>
          <img
            src={placemark.iconUrl}
            alt={`${placemark.name} marker`}
            width={32}
            height={32}
          />
        </AdvancedMarker>
      );
    case "polygon":
      return (
        <Polygon
          paths={placemark.coordinates}
          fillColor={truncateColorString(placemark.polygon_color)}
          strokeColor={truncateColorString(placemark.line_color)}
        />
      );
    case "line":
      return (
        <Polyline
          path={placemark.coordinates}
          strokeColor={truncateColorString(placemark.line_color)}
        />
      );
  }
};
