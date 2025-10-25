import { useAuthSlice } from "@/app/providers";
import type { EventDto } from "@/entities/event";
import { useOrderStore } from "@/entities/order";
import { EditEvent, canUserEdit } from "@/features/create-edit-event";
import { ErrorMessage } from "@/shared/ui/ErrorMessage";
import { useNavigate } from "react-router";

type EditEventActionProps = {
  numbericId: number;
};

export const EditEventAction: React.FC<EditEventActionProps> = ({
  numbericId,
}) => {
  const navigate = useNavigate();
  const { user } = useAuthSlice();
  const { setEventOrder } = useOrderStore();

  if (!user)
    return <ErrorMessage errors={new Error("No user found, login please!")} />;

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
