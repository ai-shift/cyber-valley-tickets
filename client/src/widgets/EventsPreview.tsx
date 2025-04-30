import { type Event, EventCard } from "@/entities/event";

type EventsPreviewProps = {
  events: Event[];
  limit?: number;
};
export const EventsPreview: React.FC<EventsPreviewProps> = ({
  events,
  limit,
}) => {
  const displayEvents = limit ? events.slice(0, limit) : events;
  return (
    <div>
      {displayEvents.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
};
