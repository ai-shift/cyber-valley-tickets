import { EditEventAction } from "@/features/edit-event";
import { PageContainer } from "@/shared/ui/PageContainer";
import { Navigate, useParams } from "react-router";

export const EditEventPage: React.FC = () => {
  const { eventId } = useParams();

  if (eventId === undefined || Number.isNaN(Number(eventId)))
    return <Navigate to={"/events"} />;

  const numbericId = +eventId;

  return (
    <PageContainer name="Edit page">
      <EditEventAction numbericId={numbericId} />
    </PageContainer>
  );
};
