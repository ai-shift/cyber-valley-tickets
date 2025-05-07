import type { EventPlace } from "@/entities/place";

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
  const selectedTite = places.find((place) => `${place.id}` === value)?.title;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Place">{selectedTite}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {places.map((place) => (
          <SelectItem key={place.id} value={`${place.id}`}>
            <PlaceCard place={place} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

type PlaceCardProps = {
  place: EventPlace;
};

const PlaceCard: React.FC<PlaceCardProps> = ({ place }) => {
  const { title, minTickets, maxTickets, daysBeforeCancel, minPrice } = place;
  return (
    <div>
      <h2>{title}</h2>
      <p>
        {minTickets} &lt;&lt; tickets &lt;&lt; {maxTickets}
      </p>
      <p>Cancel: {daysBeforeCancel}</p>
      <p>Min price: {minPrice}</p>
    </div>
  );
};
