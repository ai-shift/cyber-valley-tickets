import { eventQueries } from "@/entities/event";
import { formatAddress } from "@/shared/lib/formatAddress";
import { ErrorMessage } from "@/shared/ui/ErrorMessage";
import { Loader } from "@/shared/ui/Loader";
import { ExternalLink } from "lucide-react";

import { useQuery } from "@tanstack/react-query";

type EventAttendeesProps = {
  eventId: number;
};

export const EventAttendees: React.FC<EventAttendeesProps> = ({ eventId }) => {
  const {
    data: event,
    error,
    isLoading,
  } = useQuery(eventQueries.detail(eventId));

  if (isLoading) return <Loader />;
  if (error) return <ErrorMessage errors={error} />;
  if (!event) return <ErrorMessage errors={error} />;

  const attendees = event.attendees;
  if (attendees.length < 1) {
    return <h1>unluck {eventId}</h1>;
  }
  return (
    <div className="px-6">
      <table className="w-full text-left table-auto min-w-max">
        <thead>
          <tr>
            <th>Address</th>
            <th>Social</th>
          </tr>
        </thead>
        <tbody>
          {attendees.map((a) => (
            <tr key={a.address}>
              <td>
                <a
                  className="inline-flex items-center space-x-1 gap-1"
                  href={`https://etherscan.io/address/${a.address}`}
                >
                  {formatAddress(a.address as `0x${string}`)}
                  <ExternalLink className="size-4" />
                </a>
              </td>
              <td>
                {a.socials.network}: {a.socials.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
