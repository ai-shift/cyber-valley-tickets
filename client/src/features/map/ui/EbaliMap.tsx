import {
  AdvancedMarker,
  Map as GMap,
  InfoWindow,
} from "@vis.gl/react-google-maps";
import { useState } from "react";
import { Polygon } from "../ui/components/polygon.tsx";
import { Polyline } from "../ui/components/polyline.tsx";

import type { Placemark as PlacemarkType } from "../model/types.ts";

import { findApproximatePolygonCenter } from "../lib/approximateCenter.ts";
import { truncateColorString } from "../lib/colorTruncator.ts";
import { extractPlacemarkId } from "../lib/extractPlacemarkId.ts";

import bpn_data from "@/data/geodata/bpn_data.json";
import bridge from "@/data/geodata/bridge.json";
import districts from "@/data/geodata/districts.json";
import dots from "@/data/geodata/dots.json";
import leasehold from "@/data/geodata/leasehold.json";
import lots from "@/data/geodata/lots.json";
import objects from "@/data/geodata/objects.json";
import paths from "@/data/geodata/paths.json";
import regions from "@/data/geodata/regions.json";

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

  const [selectedId, setSelectedId] = useState("");
  const [selectedPlacemark, setSelectedPlacemark] =
    useState<PlacemarkType | null>(null);
  const [infoWindowShown, setInfoWindowShown] = useState(false);

  const onPlacemarkClick = (placemark: PlacemarkType) => {
    const id = extractPlacemarkId(placemark);
    setSelectedId(id);
    if (placemark) {
      setSelectedPlacemark(placemark);
    }

    if (id !== selectedId) {
      setInfoWindowShown(true);
    } else {
      setInfoWindowShown((isShown) => !isShown);
    }
  };

  const onMapClick = () => {
    setSelectedId("");
    setSelectedPlacemark(null);
    setInfoWindowShown(false);
  };

  const getInfoWindowPosition = (mark: PlacemarkType) => {
    switch (mark.type) {
      case "point":
        return mark.coordinates;
      case "polygon":
        return findApproximatePolygonCenter(mark.coordinates);
      case "line":
        return mark.coordinates[Math.floor(mark.coordinates.length / 2)];
    }
  };

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
        onClick={onMapClick}
        gestureHandling="greedy"
        colorScheme="DARK"
        disableDefaultUI
      >
        {displayed.map((layer) =>
          geodata[layer].map((placemark, idx) => (
            <Placemark
              onClick={(placemark) => onPlacemarkClick(placemark)}
              key={`${placemark.name}-${idx}`}
              placemark={placemark as PlacemarkType}
            />
          )),
        )}
        {infoWindowShown && selectedPlacemark && (
          <InfoWindow
            pixelOffset={[0, -2]}
            position={getInfoWindowPosition(selectedPlacemark)}
            onCloseClick={() => setInfoWindowShown(false)}
            className="p-3"
          >
            <h2>{selectedPlacemark.name}</h2>
          </InfoWindow>
        )}
      </GMap>
    </div>
  );
};

type PlacemarkProps = {
  placemark: PlacemarkType;
  onClick: (placemark: PlacemarkType) => void;
};

const Placemark: React.FC<PlacemarkProps> = ({ placemark, onClick }) => {
  const clickHandler = () => onClick(placemark);
  switch (placemark.type) {
    case "point":
      return (
        <AdvancedMarker onClick={clickHandler} position={placemark.coordinates}>
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
          onClick={clickHandler}
          paths={placemark.coordinates}
          fillColor={truncateColorString(placemark.polygon_color)}
          strokeColor={truncateColorString(placemark.line_color)}
        />
      );
    case "line":
      return (
        <Polyline
          onClick={clickHandler}
          path={placemark.coordinates}
          strokeColor={truncateColorString(placemark.line_color)}
        />
      );
  }
};
