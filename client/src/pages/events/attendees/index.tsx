import { EventAttendees } from "@/features/event-attendees";
import { PageContainer } from "@/shared/ui/PageContainer";
import { Navigate, useParams } from "react-router";

export const EventAttendeesPage: React.FC = () => {
  const { eventId } = useParams();
  if (eventId === undefined) return <Navigate to={"/events"} />;
  return (
    <PageContainer name="Event Attendees">
      <EventAttendees eventId={Number(eventId)} />
    </PageContainer>
  );
};
