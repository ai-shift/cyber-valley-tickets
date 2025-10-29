import type { Placemark } from "@/entities/geodata";
import { Loader } from "@/shared/ui/Loader";
import { Expandable } from "@/shared/ui/expandable/ui/Expandable";
import { ExpandableContent } from "@/shared/ui/expandable/ui/ExpandableContent";
import { ExpandableTrigger } from "@/shared/ui/expandable/ui/ExpandableTrigger";
import { useMap } from "@vis.gl/react-google-maps";
import { twMerge } from "tailwind-merge";
import { getPlacemarkPosition } from "../lib/getCenterPosition.ts";
import { getThumbUrl } from "../lib/getThumbUrl.ts";

type LayerControlProps = {
  value: string;
  isLoading: boolean;
  isError: boolean;
  isDisplayed: boolean;
  setIsDisplayed: (groupName: string) => void;
  placemarks: Placemark[];
  showInfo: (placemark: Placemark) => void;
  closeGroups: () => void;
};

export const LayerControl: React.FC<LayerControlProps> = ({
  value,
  isLoading,
  isError,
  isDisplayed,
  setIsDisplayed,
  placemarks,
  showInfo,
  closeGroups,
}) => {
  const map = useMap();

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

  return (
    <Expandable defaultOpened>
      <ExpandableTrigger className="capitalize flex gap-3 text-xl items-center w-full">
        {({ isCurrentExpanded }: { isCurrentExpanded: boolean }) => (
          <>
            <input
              type="checkbox"
              checked={isDisplayed}
              onChange={() => setIsDisplayed(value)}
              onClick={(e) => e.stopPropagation()}
            />
            <img
              className={twMerge(
                "h-4 transition-all duration-300",
                isCurrentExpanded && "rotate-90",
              )}
              alt="chevrone"
              src="/icons/chevrone_right.svg"
            />
            <span>{value.replace(/_/, " ")}</span>
          </>
        )}
      </ExpandableTrigger>
      {isLoading && <Loader containerClassName="h-10" className="h-4" />}
      {isError && <p>Couldn't load the layer</p>}
      {isDisplayed && !isError && (
        <ExpandableContent>
          <div className="flex flex-col items-start">
            {placemarks?.map((placemark, idx) => (
              <button
                type="button"
                className="flex gap-1 items-center justify-center"
                key={`${placemark.name}-${idx}`}
                onClick={() => handleClick(placemark)}
              >
                <img
                  className="aspect-square h-6"
                  alt={placemark.name}
                  src={getThumbUrl(placemark)}
                />
                <p className="text-lg">{placemark.name}</p>
              </button>
            ))}
          </div>
        </ExpandableContent>
      )}
    </Expandable>
  );
};
