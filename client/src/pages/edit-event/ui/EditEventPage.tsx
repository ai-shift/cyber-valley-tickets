import { CreateEditEvent } from "@/features/create-edit-event";
import { PageContainer } from "@/shared/ui/PageContainer";
import { Navigate, useParams } from "react-router";

export const EditEventPage: React.FC = () => {
  const { eventId } = useParams();

  if (eventId === undefined) return <Navigate to={"/events"} />;

  function updateOrder() {
    console.log("Updated");
  }

  return (
    <PageContainer name="Edit page">
      <CreateEditEvent editEventId={eventId} onSubmit={updateOrder} />
    </PageContainer>
  );
};
