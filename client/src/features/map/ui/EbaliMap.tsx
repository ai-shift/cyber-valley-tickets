import { Map as GMap, InfoWindow } from "@vis.gl/react-google-maps";
import { Layers } from "lucide-react";
import { useState } from "react";
import { twMerge } from "tailwind-merge";

import { extractPlacemarkId } from "../lib/extractPlacemarkId.ts";

import type { LatLng, Placemark as PlacemarkType } from "@/entities/geodata";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet.tsx";
import { useGeodata } from "../hooks/useGeodata.tsx";
import { getPlacemarkPosition } from "../lib/getCenterPosition.ts";
import { useMapState } from "../model/slice.ts";
import { LayerControl } from "./LayerControl.tsx";
import { MapLongPressHandler } from "./MapLongPressHandler.tsx";
import { Placemark } from "./Placemark.tsx";

type GeodataKey = string;

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
    displayedGroups,
    toggleGroup,
    zoom,
    center,
    selectedId,
    selectedPlacemark,
    infoWindowShown,
    setZoom,
    setCenter,
    setSelectedId,
    setSelectedPlacemark,
    setInfoWindowShown,
  } = useMapState();
  const [showGroups, setShowGroups] = useState(false);

  const { layersTitles, loadingLayers, errorLayers, geodata } =
    useGeodata(displayedGroups);

  const displayGroupHandler = (value: GeodataKey) => {
    toggleGroup(value);
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
      setInfoWindowShown(!infoWindowShown);
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
        setZoom(ev.detail.zoom);
      }}
      onCenterChanged={(ev) => {
        setCenter(ev.detail.center as LatLng);
      }}
    >
      <Sheet open={showGroups} onOpenChange={setShowGroups} modal={false}>
        <SheetTrigger>
          <div className="absolute top-3 right-3 aspect-square h-10 rounded-full bg-black flex items-center justify-center">
            <Layers className="w-6 h-6 text-primary" />
          </div>
        </SheetTrigger>
        <SheetContent side="left" aria-describedby={undefined}>
          <SheetTitle className="p-3 text-lg">Layers</SheetTitle>
          <div className="h-full overflow-y-auto px-4">
            {layersTitles.map((title) => {
              const placemarks = geodata[title] as PlacemarkType[];
              return (
                <LayerControl
                  key={title}
                  value={title}
                  isLoading={loadingLayers.includes(title)}
                  isError={errorLayers.includes(title)}
                  isDisplayed={displayedGroups.includes(title)}
                  setIsDisplayed={() => displayGroupHandler(title)}
                  placemarks={placemarks}
                  showInfo={showPlacemarkInfo}
                  closeGroups={() => setShowGroups(false)}
                />
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
      {displayedGroups.map((layer) => {
        return geodata[layer]?.map((placemark, idx) => (
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
          <h2>{selectedPlacemark.name}</h2>
        </InfoWindow>
      )}
      <MapLongPressHandler onLongPressMs={700} onLongPress={longPressHandler} />
      {children}
    </GMap>
  );
};
