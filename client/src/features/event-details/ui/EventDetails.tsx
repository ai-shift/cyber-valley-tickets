import { eventQueries } from "@/entities/event";
import { useUser } from "@/entities/user";
import { cn } from "@/shared/lib/utils";
import { useQuery } from "@tanstack/react-query";

import { StatusBage } from "@/features/events-list/ui/StatusBage";
import { MaybeManageEvent } from "@/features/manage-event";
import { Ticket } from "@/features/ticket";
import { formatTimestamp } from "@/shared/lib/formatTimestamp";
import { ErrorMessage } from "@/shared/ui/ErrorMessage";
import { Loader } from "@/shared/ui/Loader";
import { DetailsBlock } from "./DetailsBlock";

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

  const isCreator = user.address === event.creator.address;
  const isMaster = user.role === "master";

  return (
    <div className="flex flex-col">
      <div className="relative">
        <img
          className="aspect-video object-cover object-center"
          src={imageUrl ?? "/event_default.jpg"}
          alt={title}
        />
        <div className="absolute top-3 right-2">
          {status === "approved" ? (
            <p className="px-3 py-1 text-primary text-md font-semibold rounded-full self-start bg-black">
              Tickets available: {place.maxTickets - (ticketsBought || 0)}
            </p>
          ) : (
            <StatusBage status={status} />
          )}
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
          className={cn(isCreator || isMaster || "col-span-2")}
        />
        <DetailsBlock
          icon="/icons/duration_2.svg"
          title="Duration"
          information={`${daysAmount} day${daysAmount > 1 ? "s" : ""}`}
        />

        {(isCreator || isMaster) && (
          <DetailsBlock
            icon="/icons/Attendees_2.svg"
            title="Tickets available"
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
        canEdit={isMaster}
        role={user.role}
        status={event.status}
      />
    </div>
  );
};
