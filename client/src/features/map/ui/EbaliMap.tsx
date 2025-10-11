import { Map as GMap, InfoWindow } from "@vis.gl/react-google-maps";
import { useState } from "react";

import type { Placemark as PlacemarkType } from "../model/types.ts";

import { extractPlacemarkId } from "../lib/extractPlacemarkId.ts";

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet.tsx";
import { geodata } from "../data/data.ts";
import { getPlacemarkPosition } from "../lib/getCenterPosition.ts";
import { Placemark } from "./Placemark.tsx";
import { PlacemarkGroup } from "./PlacemarkGroup.tsx";

type GeodataKey = keyof typeof geodata;

export const EbaliMap: React.FC = () => {
  const [displayedGroups, setDisplayedGroups] = useState<GeodataKey[]>([]);
  const [showGroups, setShowGroups] = useState(false);

  const [selectedId, setSelectedId] = useState("");
  const [selectedPlacemark, setSelectedPlacemark] =
    useState<PlacemarkType | null>(null);
  const [infoWindowShown, setInfoWindowShown] = useState(false);

  const displayGroupHandler = (value: GeodataKey) => {
    if (displayedGroups.includes(value)) {
      setDisplayedGroups((prev) => prev.filter((el) => el !== value));
    } else {
      setDisplayedGroups((prev) => [...prev, value as GeodataKey]);
    }
  };

  const showPlacemarkInfo = (placemark: PlacemarkType) => {
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
        <Sheet open={showGroups} onOpenChange={setShowGroups}>
          <SheetTrigger>
            <div className="absolute top-3 right-3 aspect-square h-10 rounded-full bg-primary" />
          </SheetTrigger>
          <SheetContent side="left" aria-describedby={undefined}>
            <SheetTitle className="p-3 text-lg">Layers</SheetTitle>
            <div className="h-full overflow-y-auto px-4">
              {Object.keys(geodata).map((group) => {
                const placemarks = geodata[
                  group as GeodataKey
                ] as PlacemarkType[];
                if (placemarks.length > 0) {
                  return (
                    <PlacemarkGroup
                      key={group}
                      value={group}
                      isDisplayed={displayedGroups.includes(
                        group as GeodataKey,
                      )}
                      setDisplayed={() =>
                        displayGroupHandler(group as GeodataKey)
                      }
                      placemarks={placemarks}
                      showInfo={showPlacemarkInfo}
                      closeGroups={() => setShowGroups(false)}
                    />
                  );
                }
              })}
            </div>
          </SheetContent>
        </Sheet>
        {displayedGroups.map((layer) =>
          geodata[layer].map((placemark, idx) => (
            <Placemark
              onClick={(placemark) => showPlacemarkInfo(placemark)}
              key={`${placemark.name}-${idx}`}
              placemark={placemark as PlacemarkType}
            />
          )),
        )}
        {infoWindowShown && selectedPlacemark && (
          <InfoWindow
            pixelOffset={[0, -2]}
            position={getPlacemarkPosition(selectedPlacemark)}
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
