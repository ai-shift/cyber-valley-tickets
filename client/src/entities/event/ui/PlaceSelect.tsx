import type { EventPlaceModel } from "@/entities/place";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "@/shared/ui/select";

type PlaceSelectProps = {
  value: string;
  onChange: (...event: unknown[]) => void;
  places: EventPlaceModel[];
};

export const PlaceSelect: React.FC<PlaceSelectProps> = ({
  value,
  onChange,
  places,
}) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Place" />
      </SelectTrigger>
      <SelectContent>
        {places.map((place) => (
          <SelectItem key={place.id} value={place.id}>
            {place.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
