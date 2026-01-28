import type { Event } from "@/entities/event";
import { useNavigate } from "react-router";

type PlacemarkEventListProps = {
  events: Omit<Event, "place">[];
};

export const PlacemarkEventList: React.FC<PlacemarkEventListProps> = ({
  events,
}) => {
  const navigate = useNavigate();

  return (
    <div className="divide-y-[1px] divide-primary">
      {events.map((event) => (
        <button
          key={event.id}
          className="my-1 block text-start"
          onClick={() => navigate(`/events/${event.id}`)}
          type="button"
        >
          <h3 className="text-xl text-secondary">{event.title}</h3>
          <p className="text-md text-secondary">
            {event.description.slice(0, 80)}
          </p>
          <p className="text-secondary">Some more info here</p>
        </button>
      ))}
    </div>
  );
};
