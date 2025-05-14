import { eventQueries } from "@/entities/event";
import { useUser } from "@/entities/user";
import { cn } from "@/shared/lib/utils";
import { useQuery } from "@tanstack/react-query";

import { canEdit } from "@/features/create-edit-event";
import { MaybeManageEvent } from "@/features/manage-event";
import { Ticket } from "@/features/ticket";
import { formatTimestamp } from "@/shared/lib/formatTimestamp";
import { ErrorMessage } from "@/shared/ui/ErrorMessage";
import { Loader } from "@/shared/ui/Loader";
import { DetailsBlock } from "./DetailsBlock";
import { StatusBage } from "@/features/events-list/ui/StatusBage";

type EventDetailsProps = {
  eventId: number;
};

export const EventDetails: React.FC<EventDetailsProps> = ({ eventId }) => {
  const { user } = useUser();
  const {
    data: event,
    error,
    isLoading,
  } = useQuery(eventQueries.detail(eventId));

  if (isLoading) return <Loader />;
  if (error) return <ErrorMessage errors={error} />;
  if (!event || !user) return <ErrorMessage errors={error} />;

  const {
    imageUrl,
    title,
    description,
    place,
    ticketPrice,
    ticketsBought,
    startDateTimestamp,
    daysAmount,
    status,
  } = event;

  const editPermission = canEdit(user, event);

  return (
    <div className="flex flex-col">
      <div className="relative">
        <img
          className="aspect-video object-cover object-center"
          src={imageUrl ?? "/event_default.jpg"}
          alt={title}
        />
        <div className="absolute top-3 right-2">
          <StatusBage status={status} />
        </div>
      </div>
      <div className="bg-secondary py-10 px-4 text-black space-y-8">
        <h2 className="font-semibold text-3xl">{title}</h2>
        <p className="text-xl">{description}</p>
      </div>

      <div className="px-4 pt-5">
        <DetailsBlock
          icon="/icons/event place_2.svg"
          title="Location"
          information={place.title}
        />
      </div>
      <div className="grid grid-cols-2 gap-3 px-4 py-3">
        <DetailsBlock
          icon="/icons/calendar.svg"
          title="Date"
          information={formatTimestamp(startDateTimestamp)}
          className={cn(editPermission || "col-span-2")}
        />
        <DetailsBlock
          icon="/icons/duration_2.svg"
          title="Duration"
          information={`${daysAmount} day${daysAmount > 1 ? "s" : ""}`}
        />

        {editPermission && (
          <DetailsBlock
            icon="/icons/Attendees_2.svg"
            title="Tickets"
            information={`${place.maxTickets - Number(ticketsBought)}`}
          />
        )}
        <DetailsBlock
          icon="/icons/price_2.svg"
          title="Price"
          information={`${ticketPrice}`}
        />
      </div>

      <Ticket event={event} user={user} />
      <MaybeManageEvent
        eventId={eventId}
        canEdit={editPermission}
        role={user.role}
        status={event.status}
      />
    </div>
  );
};
