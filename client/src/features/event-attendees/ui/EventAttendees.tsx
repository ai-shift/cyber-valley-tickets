import { eventQueries } from "@/entities/event";
import { ErrorMessage } from "@/shared/ui/ErrorMessage";
import { Loader } from "@/shared/ui/Loader";

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
    <table>
      <thead>
        <tr>
          <th>Address</th>
          <th>Social</th>
        </tr>
      </thead>
      <tbody>
        {attendees.map((a) => (
          <tr key={a.address}>
            <td>{a.address}</td>
            <td>
              {a.socials.network}: {a.socials.value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
