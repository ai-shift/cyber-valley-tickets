import { Link } from "react-router";
import type { Event } from "../model/types";

type EventCardProps = {
  event: Event;
};

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const { imageUrl, place, startDateTimestamp, daysAmount, title } = event;

  return (
    <article>
      <img
        src={
          imageUrl ??
          "https://img.freepik.com/premium-vector/default-image-icon-vector-missing-picture-page-website-design-mobile-app-no-photo-available_87543-11093.jpg"
        }
        alt={title}
      />
      <div className="flex justify-between">
        <div>
          <h3>{place.title}</h3>
          <p>{title}</p>
          <p>
            {startDateTimestamp} ({daysAmount})
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
