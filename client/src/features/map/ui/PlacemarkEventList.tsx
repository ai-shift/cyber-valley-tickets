import type { Event } from "@/entities/event";
import { memo, useCallback } from "react";
import { useNavigate } from "react-router";

type PlacemarkEventListProps = {
  events: Omit<Event, "place">[];
};

type EventItemProps = {
  event: Omit<Event, "place">;
  onEventClick: (eventId: number) => void;
};

const EventItem = memo(({ event, onEventClick }: EventItemProps) => (
  <button
    key={event.id}
    className="my-1 block text-start"
    onClick={() => onEventClick(event.id)}
    type="button"
  >
    <h3 className="text-xl text-secondary">{event.title}</h3>
    <p className="text-md text-secondary">{event.description.slice(0, 80)}</p>
  </button>
));

export const PlacemarkEventList: React.FC<PlacemarkEventListProps> = memo(
  ({ events }) => {
    const navigate = useNavigate();

    const handleEventClick = useCallback(
      (eventId: number) => {
        navigate(`/events/${eventId}`);
      },
      [navigate],
    );

    return (
      <div className="divide-y-[1px] divide-primary">
        {events.map((event) => (
          <EventItem
            key={event.id}
            event={event}
            onEventClick={handleEventClick}
          />
        ))}
      </div>
    );
  },
);
