import { useQuery } from "@tanstack/react-query";
import { eventQueries } from "@/entities/event";
import { useUser } from "@/entities/user";

import { Ticket } from "@/features/ticket";
import { formatTimestamp } from "@/shared/lib/formatTimestamp";
import { DetailsBlock } from "./DetailsBlock";
import { ManageEvent } from "@/features/manage-event";
import { canEdit } from "@/features/create-edit-event";

type EventDetailsProps = {
  eventId: string;
};
export const EventDetails: React.FC<EventDetailsProps> = ({ eventId }) => {
  const { user } = useUser();
  const {
    data: event,
    error,
    isFetching,
  } = useQuery(eventQueries.detail(+eventId));

  console.log(error);

  //TODO: Replace with single component
  if (isFetching) return <p>Loading</p>;
  if (error) return <p>{error.type}</p>;
  if (!event || !user) return <p>GG</p>;

  const {
    imageUrl,
    title,
    description,
    place,
    ticketPrice,
    ticketsBought,
    startDateTimestamp,
  } = event;

  const editPermission = canEdit(user, event);

  return (
    <div className="flex flex-col">
      <img
        className="aspect-3/1 object-cover object-center"
        src={
          imageUrl ??
          "https://img.freepik.com/premium-vector/default-image-icon-vector-missing-picture-page-website-design-mobile-app-no-photo-available_87543-11093.jpg"
        }
        alt={title}
      />
      <div className="bg-blue-400">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      <DetailsBlock
        icon={<p>Calendar</p>}
        title="Date"
        information={formatTimestamp(startDateTimestamp)}
      />
      <DetailsBlock
        icon={<p>Loco</p>}
        title="Location"
        information={place.title}
      />
      <div className="my-5 bg-blue-400 h-[2px] w-full" />
      <div className="flex gap-3 justify-between">
        <DetailsBlock
          icon={<p>Attendees</p>}
          title="Attendees"
          information={`${ticketsBought}`}
        />
        <DetailsBlock
          icon={<p>Dollar</p>}
          title="Price"
          information={`${ticketPrice}`}
        />
      </div>

      <Ticket event={event} user={user} />
      <ManageEvent
        eventId={eventId}
        canEdit={editPermission}
        role={user.role}
        status={event.status}
      />
    </div>
  );
};
