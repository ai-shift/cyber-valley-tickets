import type { EventPlace } from "@/entities/place";
import { pluralDays } from "@/shared/lib/pluralDays";
import { getCurrencySymbol } from "@/shared/lib/web3";

export type PlaceCardProps = {
  place: EventPlace;
};

export const PlaceCard: React.FC<PlaceCardProps> = ({ place }) => {
  return (
    <div className="text-secondary border-2 border-secondary p-4">
      <div>
        <h3 className="font-bold mb-2 text-lg">{place.title}</h3>
        <ul className=" space-y-1 text-md text-muted">
          <li>Min Tickets: {place.minTickets}</li>
          <li>Max Tickets: {place.maxTickets}</li>
          <li>
            Min Ticket Price: {place.minPrice}{" "}
            <img
              src={getCurrencySymbol()}
              className="h-6 aspect-square inline"
              alt="currency"
            />
          </li>
          <li>
            Minimum duration: {place.minDays} {pluralDays(place.minDays)}
          </li>
          <li>
            Cancel: {place.daysBeforeCancel}{" "}
            {pluralDays(place.daysBeforeCancel)} before event
          </li>
        </ul>
      </div>
    </div>
  );
};
