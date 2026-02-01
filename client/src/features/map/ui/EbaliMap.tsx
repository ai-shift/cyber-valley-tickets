import {
  AdvancedMarker,
  Map as GMap,
  InfoWindow,
  Pin,
  useMap,
} from "@vis.gl/react-google-maps";
import { Layers, RotateCcw, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { twMerge } from "tailwind-merge";

import type { LatLng, Placemark as PlacemarkType } from "@/entities/geodata";
import { debounce } from "@/shared/lib/debounce.ts";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet.tsx";
import { getPlacemarkPosition } from "../lib/getCenterPosition.ts";
import { useMapState } from "../model/slice.ts";
import { EventsLayerControl } from "./EventsLayerControl.tsx";
import { FeatureAttributes } from "./FeatureAttributes.tsx";
import { LayerControl } from "./LayerControl.tsx";
import { MapLongPressHandler } from "./MapLongPressHandler.tsx";
import { Placemark } from "./Placemark.tsx";
import { PlacemarkEventList } from "./PlacemarkEventList.tsx";

type EbaliMapProps = {
  initialCenter?: LatLng;
  className?: string;
  longPressHandler?: (latLng: LatLng) => void;
  children?: React.ReactNode;
  requireTwoFingerScroll?: boolean;
  layersOpacity?: number;
};

export const EbaliMap: React.FC<EbaliMapProps> = ({
  initialCenter,
  className,
  longPressHandler,
  children,
  requireTwoFingerScroll = true,
  layersOpacity = 1,
}) => {
  const {
    isInitial,
    resetState,
    zoom,
    center,
    selectedPlacemark,
    setZoom,
    setCenter,
    setSelectedPlacemark,
    layersTitles,
    fetchLayersTitles,
    getDisplayedLayers,
    selectEventPlace,
    selectedPlace,
    eventPlaceLayer,
    displayedGroups,
    fetchLayer,
  } = useMapState();

  const map = useMap();
  const [showGroups, setShowGroups] = useState(false);

  useEffect(() => {
    fetchLayersTitles();
  }, [fetchLayersTitles]);

  useEffect(() => {
    if (layersTitles.length === 0) return;

    for (const group of displayedGroups) {
      if (layersTitles.includes(group)) {
        fetchLayer(group);
      }
    }
  }, [layersTitles, displayedGroups, fetchLayer]);

  const displayedLayers = getDisplayedLayers();

  const onMapClick = useCallback(() => {
    setSelectedPlacemark(null);
    selectEventPlace(null);
  }, [setSelectedPlacemark, selectEventPlace]);

  useEffect(() => {
    if (!map) return;
    if (isInitial) {
      map.setZoom(zoom);
      map.setCenter(center);
    }
  }, [isInitial, zoom, center]);

  const debSetZoom = useMemo(() => debounce(setZoom, 500), [setZoom]);
  const debSetCenter = useMemo(() => debounce(setCenter, 500), [setCenter]);

  return (
    <div className={twMerge("w-full h-[50dvh] flex relative", className)}>
      <button
        className="top-3 right-3 z-10 absolute h-14 rounded-full aspect-square bg-black flex items-center justify-center"
        type="button"
        onClick={resetState}
      >
        <RotateCcw className="stroke-primary" />
      </button>

      <Sheet open={showGroups} onOpenChange={setShowGroups}>
        <SheetTrigger>
          <div className="absolute z-10 top-3 left-3 aspect-square h-14 rounded-full bg-black flex items-center justify-center">
            <Layers className="w-6 h-6 text-primary" />
          </div>
        </SheetTrigger>
        <SheetContent side="left" aria-describedby={undefined}>
          <SheetTitle className="p-3 text-lg">Layers</SheetTitle>
          <div className="h-full overflow-y-auto px-4">
            <EventsLayerControl
              closeGroups={() => {
                setShowGroups(false);
              }}
            />
            {layersTitles.map((title) => {
              return (
                <LayerControl
                  key={title}
                  layerName={title}
                  showInfo={setSelectedPlacemark}
                  closeGroups={() => setShowGroups(false)}
                />
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
      <GMap
        className="flex-1"
        mapId="fb99876bf33e90419a932304"
        defaultCenter={
          initialCenter ?? center ?? { lat: -8.2980705, lng: 115.088186 }
        }
        defaultZoom={zoom ?? 15}
        onClick={onMapClick}
        gestureHandling={requireTwoFingerScroll ? "cooperative" : "greedy"}
        colorScheme="DARK"
        reuseMaps={true}
        mapTypeId="satellite"
        disableDefaultUI
        restriction={{
          latLngBounds: {
            north: -8.0,
            south: -8.9,
            west: 114.4,
            east: 115.8,
          },
          strictBounds: false,
        }}
        onZoomChanged={(ev) => {
          debSetZoom(ev.detail.zoom);
        }}
        onCenterChanged={(ev) => {
          debSetCenter(ev.detail.center as LatLng);
        }}
      >
        {Object.values(displayedLayers).map((layer) => {
          return layer.map((placemark, idx) => (
            <Placemark
              onClick={(placemark) => setSelectedPlacemark(placemark)}
              // Fix: Use unique identifier instead of index for stable key
              key={`${placemark.name}-${placemark.type}-${JSON.stringify(placemark.coordinates[0])}-${idx}`}
              placemark={placemark as PlacemarkType}
              opacity={layersOpacity}
            />
          ));
        })}
        {Object.values(eventPlaceLayer).map((place) => {
          const coord = place.geometry.coordinates[0];
          if (!coord) return null;
          return (
            <AdvancedMarker
              onClick={() => selectEventPlace(place.id)}
              key={place.id}
              position={coord}
            >
              <Pin
                background={"#76FF05"}
                borderColor={"#000000"}
                glyphColor={"#000000"}
                scale={2}
              />
            </AdvancedMarker>
          );
        })}
        {selectedPlacemark && (
          <InfoWindow
            pixelOffset={selectedPlacemark.type === "point" ? [0, -25] : [0, 0]}
            headerDisabled
            disableAutoPan
            position={getPlacemarkPosition(selectedPlacemark)}
            onCloseClick={() => setSelectedPlacemark(null)}
            className="text-lg"
          >
            <div className="min-w-[200px]">
              <div className="flex justify-between items-center gap-12">
                <h2 className="text-2xl">{selectedPlacemark.name}</h2>
                <button
                  className="h-8 aspect-square flex items-center justify-center ml-auto mr-0"
                  type="button"
                  onClick={() => setSelectedPlacemark(null)}
                >
                  <X className="w-full h-full stroke-secondary/70" />
                </button>
              </div>
              {selectedPlacemark.attributes && (
                <FeatureAttributes attributes={selectedPlacemark.attributes} />
              )}
              <div className="mt-2 text-xs text-muted-foreground capitalize">
                Type: {selectedPlacemark.type}
              </div>
            </div>
          </InfoWindow>
        )}
        {selectedPlace && (
          <InfoWindow
            headerDisabled
            position={selectedPlace.geometry.coordinates[0]}
          >
            <div className="flex justify-between items-center gap-12">
              <h2 className="text-primary text-xl font-bold">
                {selectedPlace.title}
              </h2>
              <button
                className="h-8 aspect-square flex items-center justify-center ml-auto mr-0"
                type="button"
                onClick={() => selectEventPlace(null)}
              >
                <X className="w-full h-full stroke-secondary/70" />
              </button>
            </div>
            <PlacemarkEventList events={selectedPlace.events} />
          </InfoWindow>
        )}
        <MapLongPressHandler
          onLongPressMs={700}
          onLongPress={longPressHandler}
        />
        {children}
      </GMap>
    </div>
  );
};
