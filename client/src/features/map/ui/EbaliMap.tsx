import {
  Map as GMap,
  InfoWindow,
  useMap,
} from "@vis.gl/react-google-maps";
import { useState } from "react";

import type { Placemark as PlacemarkType } from "../model/types.ts";

import { findApproximatePolygonCenter } from "../lib/approximateCenter.ts";
import { extractPlacemarkId } from "../lib/extractPlacemarkId.ts";

import { geodata } from "../data/data.ts"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/shared/ui/sheet.tsx";
import { Placemark } from "./Placemark.tsx";

type GeodataKey = keyof typeof geodata;

export const EbaliMap: React.FC = () => {
  const [displayedGroups, setDisplayedGroups] = useState<GeodataKey[]>([]);

  const [selectedId, setSelectedId] = useState("");
  const [selectedPlacemark, setSelectedPlacemark] =
    useState<PlacemarkType | null>(null);
  const [infoWindowShown, setInfoWindowShown] = useState(false);

  const displayGroupHandler = (value: GeodataKey,) => {
    if (displayedGroups.includes(value)) {
      setDisplayedGroups((prev) => prev.filter((el) => el !== value));
    } else {
      setDisplayedGroups((prev) => [...prev, value as GeodataKey]);
    }
  }

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
      <GMap
        style={{ width: "full", height: "50dvh" }}
        mapId="fb99876bf33e90419a932304"
        defaultCenter={{ lat: -8.2980705, lng: 115.088186 }}
        defaultZoom={16}
        onClick={onMapClick}
        gestureHandling="greedy"
        colorScheme="DARK"
        disableDefaultUI
      >
        <Sheet>
          <SheetTrigger>
            <div className="absolute top-3 right-3 aspect-square h-10 rounded-full bg-primary" />
          </SheetTrigger>
          <SheetContent side="left" aria-describedby={undefined}>
            <SheetTitle className="p-3 text-lg">Layers</SheetTitle>
            <div className="h-full overflow-y-auto px-4">
            {
              Object.keys(geodata).map((group) =>
                <PlacemarkGroup
                  key={group}
                  value={group}
                  isDisplayed={displayedGroups.includes(group as GeodataKey)}
                  setDisplayed={() => displayGroupHandler(group as GeodataKey)}
                  placemarks={geodata[group as GeodataKey] as PlacemarkType[]}
                />)
            }
            </div>
          </SheetContent>
        </Sheet>
        {displayedGroups.map((layer) =>
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

type PlacemarkGroupProps = {
  isDisplayed: boolean;
  value: string;
  setDisplayed: (groupName: string) => void;
  placemarks: PlacemarkType[];
}

export const PlacemarkGroup: React.FC<PlacemarkGroupProps> = ({ value, isDisplayed, setDisplayed, placemarks }) => {
  return (
    <div>
      <label className="flex gap-3 text-xl">
        <input
          type="checkbox"
          checked={isDisplayed}
          onChange={() => setDisplayed(value)}
        />
        {value}
      </label>
      {isDisplayed &&
        <div className="flex flex-col items-start">
          {placemarks.map((placemark, idx) =>
            <button key={`${placemark.name}-${idx}`}>
              <p className="text-lg">{placemark.name}</p>
            </button>
          )}
        </div>
      }
    </div>
  )
}
