import type { EventStatus } from "@/entities/event";

import { type Role, checkPermission } from "@/shared/lib/RBAC";
import { Button } from "@/shared/ui/button";
import { useNavigate } from "react-router";

type MaybeManageEventProps = {
  role: Role;
  status: EventStatus;
  eventId: number;
  canEdit: boolean;
};

export const MaybeManageEvent: React.FC<MaybeManageEventProps> = ({
  role,
  status,
  eventId,
  canEdit,
}) => {
  if (status !== "submitted") return;
  const navigate = useNavigate();

  const canControl = checkPermission(role, "event:accept/decline");

  function onEdit() {
    navigate(`/events/${eventId}/edit`);
  }

  //TODO: @scipunch Add fetching logic and rewrite to sepparate functions if switch is shit
  function onControll(action: "accept" | "decline") {
    switch (action) {
      case "accept":
        break;
      case "decline":
        break;
      default:
        return;
    }
  }

  return (
    <div>
      {canEdit && <Button onClick={onEdit}>Edit</Button>}
      {canControl && (
        <div className=" flex gap-7">
          <Button onClick={() => onControll("accept")}>Accept</Button>
          <Button onClick={() => onControll("decline")}>Decline</Button>
        </div>
      )}
    </div>
  );
};
