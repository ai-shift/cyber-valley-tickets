import { Link } from "react-router";
import type { Event } from "../model/event";

type EventCardProps = {
  event: Event;
};

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const { imageUrl, place, startDate, durationDays, title } = event;

  return (
    <article>
      <img src={imageUrl} alt={title} />
      <div className="flex justify-between">
        <div>
          <h3>{place}</h3>
          <p>{title}</p>
          <p>
            {startDate} ({durationDays})
          </p>
        </div>
        <Link
          to={`/events/${event.id}`}
          className="flex justify-center items-center"
        >
          &#8594;
        </Link>
      </div>
    </article>
  );
};
