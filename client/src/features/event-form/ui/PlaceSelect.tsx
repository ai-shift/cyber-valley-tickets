import type { EventPlace } from "@/entities/place";
import { pluralDays } from "@/shared/lib/pluralDays";
import { getCurrencySymbol } from "@/shared/lib/web3";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
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
        {places.map((place, i) => (
          <div key={place.id}>
            <SelectItem value={`${place.id}`}>
              <PlaceCard place={place} />
            </SelectItem>
            {i !== places.length - 1 && (
              <SelectSeparator className="bg-secondary" />
            )}
          </div>
        ))}
      </SelectContent>
    </Select>
  );
};

type PlaceCardProps = {
  place: EventPlace;
};

const PlaceCard: React.FC<PlaceCardProps> = ({ place }) => {
  const {
    title,
    minTickets,
    maxTickets,
    daysBeforeCancel,
    minPrice,
    minDays,
    eventDepositSize,
  } = place;
  return (
    <div className=" space-y-3 p-3 rounded">
      <h2 className="text-xl">{title}</h2>
      <p className="text-muted text-md">
        {minTickets} &lt;&lt; tickets &lt;&lt; {maxTickets}
      </p>
      <p className="text-muted text-md">
        Deposit: {eventDepositSize}{" "}
        <img
          src={getCurrencySymbol()}
          className="h-5 aspect-square inline"
          alt="currency"
        />
      </p>
      <p className="text-muted text-md">Min price: {minPrice}</p>
      <p className="text-muted text-md">
        Min dutration: {minDays} {pluralDays(minDays)}
      </p>
      <p className="text-muted text-md">Cancel: {daysBeforeCancel}</p>
    </div>
  );
};
