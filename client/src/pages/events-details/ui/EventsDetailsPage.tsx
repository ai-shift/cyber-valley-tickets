import { EventDetails } from "@/features/event-details";
import { PageContainer } from "@/shared/ui/PageContainer";
import { Navigate, useParams } from "react-router";

export const EventsDetailsPage: React.FC = () => {
  const { eventId } = useParams();

  if (eventId === undefined) return <Navigate to={"/events"} />;

  return (
    <PageContainer name="Event Details">
      <EventDetails eventId={eventId} />
    </PageContainer>
  );
};
