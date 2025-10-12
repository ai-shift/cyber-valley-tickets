import { useMap } from "@vis.gl/react-google-maps";
import { getPlacemarkPosition } from "../lib/getCenterPosition.ts";
import type { Placemark } from "../model/types.ts";
import { getThumbUrl } from "../lib/getThumbUrl.ts";

type PlacemarkGroupProps = {
  isDisplayed: boolean;
  value: string;
  setDisplayed: (groupName: string) => void;
  placemarks: Placemark[];
  showInfo: (placemark: Placemark) => void;
  closeGroups: () => void;
};

export const PlacemarkGroup: React.FC<PlacemarkGroupProps> = ({
  value,
  isDisplayed,
  setDisplayed,
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
      <label className="flex gap-3 text-xl">
        <input
          type="checkbox"
          checked={isDisplayed}
          onChange={() => setDisplayed(value)}
        />
        {value}
      </label>
      {isDisplayed && (
        <div className="flex flex-col items-start">
          {placemarks.map((placemark, idx) => (
            <button
              type="button"
              className="flex gap-1 items-center justify-center"
              key={`${placemark.name}-${idx}`}
              onClick={() => handleClick(placemark)}
            >
              <img className="aspect-square h-6" alt={placemark.name} src={getThumbUrl(placemark)}/>
              <p className="text-lg">{placemark.name}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
