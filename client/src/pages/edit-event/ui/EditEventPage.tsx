import { useUser } from "@/entities/user";
import { CreateEditEvent } from "@/features/create-edit-event";
import { currCanEdit } from "@/features/create-edit-event";
import { PageContainer } from "@/shared/ui/PageContainer";
import { Navigate, useParams } from "react-router";

export const EditEventPage: React.FC = () => {
  const { eventId } = useParams();
  const { user } = useUser();

  if (eventId === undefined) return <Navigate to={"/events"} />;
  if (!user) return <p>I hate this</p>;

  function updateOrder() {
    console.log("Updated");
  }

  return (
    <PageContainer name="Edit page">
      <CreateEditEvent
        editEventId={eventId}
        onSubmit={updateOrder}
        canEdit={currCanEdit(user)}
      />
    </PageContainer>
  );
};
