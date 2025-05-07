import type { EventStatus } from "@/entities/event";

import { type Role, checkPermission } from "@/shared/lib/RBAC";
import { Button } from "@/shared/ui/button";
import { useNavigate } from "react-router";
import { AcceptDialog } from "./AcceptDialog";

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
    <div className="flex flex-col items-center justify-center gap-7 py-10">
      <div className="w-3/4 flex flex-col justify-center gap-9">
        {canEdit && (
          <Button className="w-full" onClick={onEdit}>
            Edit
          </Button>
        )}
        {canControl && (
          <div className="flex justify-between gap-6">
            <AcceptDialog
              option="accept"
              confirmFn={() => onControll("accept")}
            >
              <Button variant="secondary">Accept</Button>
            </AcceptDialog>
            <AcceptDialog
              option="decline"
              confirmFn={() => onControll("decline")}
            >
              <Button variant="destructive">Decline</Button>
            </AcceptDialog>
          </div>
        )}
      </div>
    </div>
  );
};
