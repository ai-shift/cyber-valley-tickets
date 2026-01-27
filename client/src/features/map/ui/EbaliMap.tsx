import { Map as GMap, InfoWindow, useMap } from "@vis.gl/react-google-maps";
import { Layers, RotateCcw, X } from "lucide-react";
import { useEffect, useState } from "react";
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
import { LayerControl } from "./LayerControl.tsx";
import { MapLongPressHandler } from "./MapLongPressHandler.tsx";
import { Placemark } from "./Placemark.tsx";

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
    infoWindowShown,
    setZoom,
    setCenter,
    setSelectedPlacemark,
    setInfoWindowShown,
    layersTitles,
    fetchLayersTitles,
    getDisplayedLayers,
  } = useMapState();
  const map = useMap();
  const [showGroups, setShowGroups] = useState(false);

  useEffect(() => {
    fetchLayersTitles();
  }, []);

  const displayedLayers = getDisplayedLayers();

  const showPlacemarkInfo = (placemark: PlacemarkType) => {
    if (placemark) {
      setSelectedPlacemark(placemark);
      setInfoWindowShown(true);
    }
  };

  const onMapClick = () => {
    setSelectedPlacemark(null);
    setInfoWindowShown(false);
  };

  useEffect(() => {
    if (!map) return;
    if (isInitial) {
      map.setZoom(zoom);
      map.setCenter(center);
    }
  }, [isInitial, zoom, center]);

  const debSetZoom = debounce(setZoom, 500);
  const debSetCenter = debounce(setCenter, 500);

  return (
    <GMap
      className={twMerge("w-full h-[50dvh] relative", className)}
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
      onZoomChanged={(ev) => {
        debSetZoom(ev.detail.zoom);
      }}
      onCenterChanged={(ev) => {
        debSetCenter(ev.detail.center as LatLng);
      }}
    >
      <button
        className="top-3 right-3 absolute h-14 rounded-full aspect-square bg-black flex items-center justify-center"
        type="button"
        onClick={resetState}
      >
        <RotateCcw className="stroke-primary" />
      </button>

      <Sheet open={showGroups} onOpenChange={setShowGroups} modal={false}>
        <SheetTrigger>
          <div className="absolute top-3 left-3 aspect-square h-14 rounded-full bg-black flex items-center justify-center">
            <Layers className="w-6 h-6 text-primary" />
          </div>
        </SheetTrigger>
        <SheetContent side="left" aria-describedby={undefined}>
          <SheetTitle className="p-3 text-lg">Layers</SheetTitle>
          <div className="h-full overflow-y-auto px-4">
            {layersTitles.map((title) => {
              return (
                <LayerControl
                  key={title}
                  layerName={title}
                  showInfo={showPlacemarkInfo}
                  closeGroups={() => setShowGroups(false)}
                />
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
      {Object.values(displayedLayers).map((layer) => {
        return layer.map((placemark, idx) => (
          <Placemark
            onClick={(placemark) => showPlacemarkInfo(placemark)}
            key={`${placemark.name}-${idx}`}
            placemark={placemark as PlacemarkType}
            opacity={layersOpacity}
          />
        ));
      })}
      {infoWindowShown && selectedPlacemark && (
        <InfoWindow
          pixelOffset={selectedPlacemark.type === "point" ? [0, -25] : [0, 0]}
          headerDisabled
          position={getPlacemarkPosition(selectedPlacemark)}
          onCloseClick={() => setInfoWindowShown(false)}
          className="text-lg"
        >
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
        </InfoWindow>
      )}
      <MapLongPressHandler onLongPressMs={700} onLongPress={longPressHandler} />
      {children}
    </GMap>
  );
};
