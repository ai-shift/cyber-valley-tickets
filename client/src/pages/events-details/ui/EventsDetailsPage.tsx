import { EventDetails } from "@/features/event-details";
import { PageContainer } from "@/shared/ui/PageContainer";
import { Navigate, useParams } from "react-router";

export const EventsDetailsPage: React.FC = () => {
  const { eventId } = useParams();

  if (eventId === undefined) return <Navigate to={"/events"} />;
  const numericId = Number(eventId);

  return (
    <PageContainer name="Event Details">
      <EventDetails eventId={numericId} />
    </PageContainer>
  );
};
