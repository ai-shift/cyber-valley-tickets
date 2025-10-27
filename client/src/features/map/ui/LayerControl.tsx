import { useMap } from "@vis.gl/react-google-maps";
import { getPlacemarkPosition } from "../lib/getCenterPosition.ts";
import { getThumbUrl } from "../lib/getThumbUrl.ts";
import type { Placemark } from "../model/types.ts";
import { Loader } from "@/shared/ui/Loader"

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
    <div>
      <label className="capitalize flex gap-3 text-xl">
        <input
          type="checkbox"
          checked={isDisplayed}
          onChange={() => setIsDisplayed(value)}
        />
        {value.replace(/_/, " ")}
      </label>
      {isLoading && <Loader containerClassName="h-10" className="h-4" />}
      {isError && <p>Couldn't load the layer</p>}
      {isDisplayed && !isError && (
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
      )}
    </div>
  );
};
