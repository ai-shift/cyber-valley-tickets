import type { Placemark } from "@/entities/geodata";
import { Loader } from "@/shared/ui/Loader";
import { Expandable } from "@/shared/ui/expandable/ui/Expandable";
import { ExpandableContent } from "@/shared/ui/expandable/ui/ExpandableContent";
import { ExpandableTrigger } from "@/shared/ui/expandable/ui/ExpandableTrigger";
import { useMap } from "@vis.gl/react-google-maps";
import { twMerge } from "tailwind-merge";
import { ChevronRight, Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { getPlacemarkPosition } from "../lib/getCenterPosition.ts";
import { getThumbUrl } from "../lib/getThumbUrl.ts";
import { useMapState } from "../model/slice.ts";

type LayerControlProps = {
  layerName: string;
  showInfo: (placemark: Placemark) => void;
  closeGroups: () => void;
};

export const LayerControl: React.FC<LayerControlProps> = ({
  layerName: value,
  showInfo,
  closeGroups,
}) => {
  const map = useMap();
  const { getDisplayedLayers, toggleGroup, loadingLayers, error } = useMapState();
  const [, setIsExpanded] = useState(true);

  const current = getDisplayedLayers()[value];

  // Auto-expand when visibility is toggled on, collapse when off
  useEffect(() => {
    const isDisplayed = !!current;
    setIsExpanded(isDisplayed);
  }, [current]);

  const handleClick = (placemark: Placemark) => {
    if (!map) {
      return;
    }
    const coordinates = getPlacemarkPosition(placemark);
    if (!coordinates) {
      return;
    }
    map.panTo(coordinates);
    map.setZoom(18);
    showInfo(placemark);
    closeGroups();
  };

  const isDisplayed = !!current;
  const isLoading = loadingLayers.includes(value);
  const isError = !!error;

  const displayName = value.replace(/_/, " ");

  return (
    <Expandable expanded={isDisplayed} setExpanded={setIsExpanded} className="mb-2">
      <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors group">
        {/* Eye icon toggle */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleGroup(value);
          }}
          className={twMerge(
            "h-8 w-8 rounded-full flex items-center justify-center transition-all",
            isDisplayed
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground/50 hover:text-muted-foreground hover:bg-accent"
          )}
        >
          {isDisplayed ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
        {/* Expand trigger */}
        <ExpandableTrigger className="flex-1 flex items-center gap-2 text-left">
          {({ isCurrentExpanded }) => (
            <>
              <ChevronRight
                className={twMerge(
                  "h-5 w-5 text-muted-foreground transition-transform duration-200",
                  isCurrentExpanded && "rotate-90"
                )}
              />
              <span
                className={twMerge(
                  "capitalize text-lg font-medium transition-opacity",
                  !isDisplayed && "opacity-50"
                )}
              >
                {displayName}
              </span>
            </>
          )}
        </ExpandableTrigger>
      </div>
      <ExpandableContent>
        <LayerItemsList
          placemarks={current || []}
          isLoading={isLoading}
          isError={isError}
          onItemClick={handleClick}
        />
      </ExpandableContent>
    </Expandable>
  );
};

// Sub-component for layer items list
interface LayerItemsListProps {
  placemarks: Placemark[];
  isLoading: boolean;
  isError: boolean;
  onItemClick: (placemark: Placemark) => void;
}

const LayerItemsList: React.FC<LayerItemsListProps> = ({
  placemarks,
  isLoading,
  isError,
  onItemClick,
}) => {
  if (isLoading) {
    return <Loader containerClassName="h-10" className="h-4" />;
  }

  if (isError) {
    return <p className="text-sm text-destructive py-2">Couldn&apos;t load the layer</p>;
  }

  if (!placemarks.length) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1.5">
      {placemarks.map((placemark, idx) => (
        <button
          type="button"
          className="flex items-center gap-2 text-left w-full rounded transition-colors py-1.5 px-2 hover:bg-accent text-base"
          key={`${placemark.name}-${idx}`}
          onClick={() => onItemClick(placemark)}
        >
          <img
            className="aspect-square h-5 flex-shrink-0 object-contain"
            alt={placemark.name}
            src={getThumbUrl(placemark)}
          />
          <span className="truncate">{placemark.name}</span>
        </button>
      ))}
    </div>
  );
};
