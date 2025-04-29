import { EventCard } from "@/entities/event";
import type { EventModel } from "@/entities/event/model/types";

type BaseEventListProps = {
  events: EventModel[];
  limit?: number;
};

export const BaseEventList: React.FC<BaseEventListProps> = ({
  events,
  limit,
}) => {
  const displayEvents = limit ? events.slice(0, limit) : events;
  return (
    <div className="space-y-7">
      {displayEvents.map((event) => (
        <EventCard key={event.title} event={event} />
      ))}
    </div>
  );
};
