import type { EventPlace } from "@/entities/place/@x/event";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

type PlaceSelectProps = {
  value: string;
  onChange: (...event: unknown[]) => void;
  places: EventPlace[];
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
          <SelectItem key={place.id} value={`${place.id}`}>
            {place.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
