import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { truncateColorString } from "../lib/colorTruncator.ts";
import type { Placemark as PlacemarkType } from "../model/types.ts";
import { Polygon } from "./components/polygon.tsx";
import { Polyline } from "./components/polyline.tsx";

type PlacemarkProps = {
  placemark: PlacemarkType;
  onClick: (placemark: PlacemarkType) => void;
};

export const Placemark: React.FC<PlacemarkProps> = ({ placemark, onClick }) => {
  const clickHandler = () => onClick(placemark);
  switch (placemark.type) {
    case "point":
      return (
        <AdvancedMarker onClick={clickHandler} position={placemark.coordinates}>
          <img
            src={placemark.iconUrl}
            alt={`${placemark.name} marker`}
            width={32}
            height={32}
          />
        </AdvancedMarker>
      );
    case "polygon":
      return (
        <Polygon
          onClick={clickHandler}
          paths={placemark.coordinates}
          fillColor={truncateColorString(placemark.polygon_color)}
          strokeColor={truncateColorString(placemark.line_color)}
        />
      );
    case "line":
      return (
        <Polyline
          onClick={clickHandler}
          path={placemark.coordinates}
          strokeColor={truncateColorString(placemark.line_color)}
        />
      );
  }
};
