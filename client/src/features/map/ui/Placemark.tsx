import type { Placemark as PlacemarkType } from "@/entities/geodata/";
import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { truncateColorString } from "../lib/colorTruncator.ts";
import { Polygon } from "./components/polygon.tsx";
import { Polyline } from "./components/polyline.tsx";

type PlacemarkProps = {
  placemark: PlacemarkType;
  onClick: (placemark: PlacemarkType) => void;
  opacity?: number;
};

export const Placemark: React.FC<PlacemarkProps> = ({
  placemark,
  onClick,
  opacity = 1,
}) => {
  const clickHandler = () => onClick(placemark);
  switch (placemark.type) {
    case "point":
      return (
        <AdvancedMarker
          onClick={clickHandler}
          position={placemark.coordinates[0]}
        >
          <img
            src={placemark.iconUrl}
            alt={`${placemark.name} marker`}
            width={32}
            height={32}
            style={{ opacity }}
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
          fillOpacity={opacity}
          strokeOpacity={opacity}
        />
      );
    case "line":
      return (
        <Polyline
          onClick={clickHandler}
          path={placemark.coordinates}
          strokeColor={truncateColorString(placemark.line_color)}
          strokeOpacity={opacity}
        />
      );
  }
};
