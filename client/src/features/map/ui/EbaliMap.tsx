import type { LatLng, Placemark as PlacemarkType } from "../model/types.ts";

import { geodataQueries } from "@/entities/geodata";
import { useQueries } from "@tanstack/react-query";
import { Map as GMap, InfoWindow } from "@vis.gl/react-google-maps";
import { useMemo, useState } from "react";
import { twMerge } from "tailwind-merge";

import { extractPlacemarkId } from "../lib/extractPlacemarkId.ts";

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet.tsx";
import { LAYER_NAMES } from "../data/data.ts";
import { getPlacemarkPosition } from "../lib/getCenterPosition.ts";
import { MapLongPressHandler } from "./MapLongPressHandler.tsx";
import { Placemark } from "./Placemark.tsx";
import { PlacemarkGroup } from "./PlacemarkGroup.tsx";

type GeodataKey = string;

type EbaliMapProps = {
  className?: string;
  longPressHandler?: (latLng: LatLng) => void;
  children?: React.ReactNode;
};

export const EbaliMap: React.FC<EbaliMapProps> = ({
  className,
  longPressHandler,
  children,
}) => {
  const layerQueries = useQueries({
    queries: Object.entries(LAYER_NAMES).map(([displayName, apiName]) =>
      geodataQueries.layer(apiName),
    ),
  });

  const geodata = useMemo(() => {
    const result: Record<string, PlacemarkType[]> = {};
    Object.keys(LAYER_NAMES).forEach((displayName, index) => {
      const queryResult = layerQueries[index];
      result[displayName] = (queryResult.data as PlacemarkType[]) || [];
    });
    return result;
  }, [layerQueries]);

  const isLoading = layerQueries.some((query) => query.isLoading);

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
    <GMap
      className={twMerge("w-full h-[50dvh] relative", className)}
      mapId="fb99876bf33e90419a932304"
      defaultCenter={{ lat: -8.2980705, lng: 115.088186 }}
      defaultZoom={16}
      onClick={onMapClick}
      gestureHandling="cooperative"
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
            {isLoading ? (
              <div className="p-4 text-center">Loading layers...</div>
            ) : (
              Object.keys(geodata).map((group) => {
                const placemarks = geodata[group] as PlacemarkType[];
                if (placemarks.length > 0) {
                  return (
                    <PlacemarkGroup
                      key={group}
                      value={group}
                      isDisplayed={displayedGroups.includes(group)}
                      setDisplayed={() => displayGroupHandler(group)}
                      placemarks={placemarks}
                      showInfo={showPlacemarkInfo}
                      closeGroups={() => setShowGroups(false)}
                    />
                  );
                }
              })
            )}
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
          headerDisabled
          position={getPlacemarkPosition(selectedPlacemark)}
          onCloseClick={() => setInfoWindowShown(false)}
          className="text-lg"
        >
          <h2>{selectedPlacemark.name}</h2>
        </InfoWindow>
      )}
      <MapLongPressHandler onLongPressMs={700} onLongPress={longPressHandler} />
      {children}
    </GMap>
  );
};
