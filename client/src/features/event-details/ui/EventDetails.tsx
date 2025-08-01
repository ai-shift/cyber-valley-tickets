import { eventQueries } from "@/entities/event";
import { cn } from "@/shared/lib/utils";
import { useQuery } from "@tanstack/react-query";

import { useAuthSlice } from "@/app/providers";
import { StatusBage } from "@/features/events-list/ui/StatusBage";
import { MaybeManageEvent } from "@/features/manage-event";
import { Ticket } from "@/features/ticket";
import { formatTimestamp } from "@/shared/lib/formatTimestamp";
import { getTimeString } from "@/shared/lib/getTimeString";
import { pluralDays } from "@/shared/lib/pluralDays";
import { ErrorMessage } from "@/shared/ui/ErrorMessage";
import { Loader } from "@/shared/ui/Loader";
import { Button } from "@/shared/ui/button";
import { useNavigate } from "react-router";
import { DetailsBlock } from "./DetailsBlock";

type EventDetailsProps = {
  eventId: number;
};

export const EventDetails: React.FC<EventDetailsProps> = ({ eventId }) => {
  const navigate = useNavigate();
  const { user } = useAuthSlice();
  const {
    data: event,
    error,
    isLoading,
  } = useQuery(eventQueries.detail(eventId));

  if (isLoading) return <Loader />;
  if (error) return <ErrorMessage errors={error} />;
  if (!event) return <ErrorMessage errors={error} />;

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
    website,
  } = event;

  const isCreator = user?.address === event.creator.address;
  const isMaster = user?.role === "master";

  return (
    <div className="flex flex-col">
      <div className="relative">
        <a
          href={website}
          target="_blank"
          className="absolute top-3 right-2 aspect-square h-10 rounded-full flex items-center justify-center bg-black"
          rel="noreferrer"
        >
          <p className="text-3xl font-bold text-primary">?</p>
        </a>
        <img
          className="w-full aspect-video object-cover object-center"
          src={imageUrl ?? "/event_default.jpg"}
          alt={title}
        />
        <div className="absolute top-3 left-2">
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
          information={
            <a
              href={place.locationUrl}
              target="_blank"
              className="underline underline-offset-2 text-secondary"
              rel="noreferrer"
            >
              {place.title}
            </a>
          }
        />
      </div>
      <div className="grid grid-cols-2 gap-3 px-4 py-3">
        <DetailsBlock
          icon="/icons/calendar.svg"
          title="Date and time"
          information={`${formatTimestamp(startDateTimestamp)} (${getTimeString(startDateTimestamp)})`}
          className={cn(isCreator || isMaster || "col-span-2")}
        />
        <DetailsBlock
          icon="/icons/duration_2.svg"
          title="Duration"
          information={`${daysAmount} ${pluralDays(daysAmount)}`}
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

      {user ? (
        <>
          <MaybeManageEvent
            eventId={eventId}
            canEdit={isMaster}
            role={user.role}
            status={event.status}
          />

          <div className="sticky bottom-2 mt-2 px-4">
            <Ticket event={event} user={user} />
          </div>
        </>
      ) : (
        <Button
          className="m-5"
          onClick={() =>
            navigate("/login", {
              state: {
                goBack: true,
              },
            })
          }
        >
          Login to get the ticket
        </Button>
      )}
    </div>
  );
};
