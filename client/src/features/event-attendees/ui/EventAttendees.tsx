import { eventQueries } from "@/entities/event";
import { DisplayUser } from "@/features/display-user";
import { ErrorMessage } from "@/shared/ui/ErrorMessage";
import { Loader } from "@/shared/ui/Loader";

import { useQuery } from "@tanstack/react-query";

type EventAttendeesProps = {
  eventId: number;
};

export const EventAttendees: React.FC<EventAttendeesProps> = ({ eventId }) => {
  const {
    data: attendees,
    error,
    isLoading,
  } = useQuery(eventQueries.attendees(eventId));

  if (isLoading) return <Loader />;
  if (error) return <ErrorMessage errors={error} />;
  if (!attendees) return <ErrorMessage errors={error} />;

  if (attendees.length < 1) {
    return (
      <div className="w-full aspect-square flex flex-col gap-3 items-center justify-center text-center">
        <p className="text-gray-500 text-lg font-semibold">
          No attendees for this event yet
        </p>
      </div>
    );
  }
  return (
    <div className="px-6">
      <table className="w-full text-left table-auto min-w-max">
        <thead>
          <tr>
            <th>User</th>
            <th>Tickets</th>
          </tr>
        </thead>
        <tbody>
          {attendees.map((a) => (
            <tr key={a.address}>
              <td>
                <DisplayUser address={a.address} />
              </td>
              <td>{a.ticketsCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
