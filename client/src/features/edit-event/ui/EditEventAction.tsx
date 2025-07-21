import { useAuthSlice } from "@/app/providers";
import type { EventDto } from "@/entities/event";
import { type Socials, useOrderStore } from "@/entities/order";
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
  const { setEventOrder, setSocials } = useOrderStore();

  if (!user)
    return <ErrorMessage errors={new Error("No user found, login please!")} />;

  function onSubmit(values: EventDto, socials?: Socials) {
    setEventOrder({ ...values, id: numbericId });
    if (socials) {
      setSocials(socials);
    }
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
