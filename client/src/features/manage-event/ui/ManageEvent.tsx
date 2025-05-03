import type { EventStatus } from "@/entities/event";

import { checkPermission, type Role } from "@/shared/lib/RBAC";
import { Button } from "@/shared/ui/button";
import { useNavigate } from "react-router";

type ManageEventProps = {
  role: Role;
  status: EventStatus;
  eventId: string;
  isCreator: boolean;
};

export const ManageEvent: React.FC<ManageEventProps> = ({
  role,
  status,
  eventId,
  isCreator,
}) => {
  if (status !== "submitted") return;
  const navigate = useNavigate();

  const canEdit = checkPermission(role, "event:edit") || isCreator;

  const canControl = checkPermission(role, "event:accept/decline");

  function onEdit() {
    navigate(`/events/${eventId}/edit`);
  }

  //TODO: Add logic and rewrite to sepparate functions if switch is shit
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

  if (canEdit) return <Button onClick={onEdit}>Edit</Button>;
  if (canControl)
    return (
      <div className=" flex gap-7">
        <Button onClick={() => onControll("accept")}>Accept</Button>
        <Button onClick={() => onControll("decline")}>Decline</Button>
      </div>
    );
};
