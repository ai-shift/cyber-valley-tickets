import type { EventDto } from "@/entities/event";
import { useOrderStore } from "@/entities/order";
import { useUser } from "@/entities/user";
import { EditEvent, canUserEdit } from "@/features/create-edit-event";
import { useNavigate } from "react-router";

type EditEventActionProps = {
  numbericId: number;
};

export const EditEventAction: React.FC<EditEventActionProps> = ({
  numbericId,
}) => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { setEventOrder } = useOrderStore();

  if (!user) return <p>I hate this</p>;

  function onSubmit(values: EventDto) {
    setEventOrder({ ...values, id: numbericId });
    navigate("/socials");
  }

  return (
    <div>
      <EditEvent
        editEventId={numbericId}
        onSubmit={onSubmit}
        canEdit={canUserEdit(user)}
      />
    </div>
  );
};
