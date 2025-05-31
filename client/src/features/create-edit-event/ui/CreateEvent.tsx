import type { Event, EventDto } from "@/entities/event";
import type { EventPlace } from "@/entities/place";
import { getCurrencySymbol, hasEnoughtTokens } from "@/shared/lib/web3";
import { Loader } from "@/shared/ui/Loader";
import { useEffect, useState } from "react";
import { useActiveAccount } from "thirdweb/react";

import { EventForm } from "@/features/event-form";
import { EventDataProvider } from "./EventDataProvider";

type CreateEventProps = {
  onSubmit: (event: EventDto) => void;
};

type CreateEventWithData = CreateEventProps & {
  events: Event[];
  places: EventPlace[];
};

const CreateEventWithData: React.FC<CreateEventWithData> = ({
  onSubmit,
  events,
  places,
}) => {
  return <EventForm events={events} places={places} onSumbit={onSubmit} />;
};

export const CreateEvent: React.FC<CreateEventProps> = ({ onSubmit }) => {
  const account = useActiveAccount();
  const [canCreate, setCanCreate] = useState(false);
  const [requriedTokens, setRequiredTokens] = useState(BigInt(0));
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    if (account == null) return;
    hasEnoughtTokens(account).then(({ enoughTokens, balanceAfterPayment }) => {
      console.log("Balance after payment", balanceAfterPayment);
      setCanCreate(enoughTokens);
      setRequiredTokens(balanceAfterPayment);
      setIsLoading(false);
    });
  }, [account]);
  return isLoading ? (
    <Loader />
  ) : canCreate ? (
    <EventDataProvider>
      {({ events, places }) => (
        <CreateEventWithData
          events={events}
          places={places}
          onSubmit={onSubmit}
        />
      )}
    </EventDataProvider>
  ) : (
    <p className="my-24 text-center text-red-500">
      Not enough tokens to create event
      <br />
      You need {requriedTokens}{" "}
      <img
        src={getCurrencySymbol()}
        className="h-6 aspect-square inline"
        alt="currency"
      />{" "}
      more
    </p>
  );
};
