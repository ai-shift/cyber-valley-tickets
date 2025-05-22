import type { EventStatus } from "@/entities/event";

import { type Role, checkPermission } from "@/shared/lib/RBAC";
import { approveEvent, declineEvent } from "@/shared/lib/web3";
import { Button } from "@/shared/ui/button";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useActiveAccount } from "thirdweb/react";
import { AcceptDialog } from "./AcceptDialog";

type MaybeManageEventProps = {
  role: Role;
  status: EventStatus;
  eventId: number;
  canEdit: boolean;
};

type ManageAction = "decline" | "accept";

export const MaybeManageEvent: React.FC<MaybeManageEventProps> = ({
  role,
  status,
  eventId,
  canEdit,
}) => {
  if (status !== "submitted") return;
  const account = useActiveAccount();
  if (!account) return <p>Failed to connect wallet</p>;
  const { mutate } = useMutation({
    mutationFn: async (action: ManageAction) => {
      switch (action) {
        case "accept":
          return await approveEvent(account, BigInt(eventId));
        case "decline":
          return await declineEvent(account, BigInt(eventId));
        default:
          throw `Unknown action: ${action}`;
      }
    },
    onSuccess: console.log,
    onError: console.error,
  });
  const navigate = useNavigate();

  const canControl = checkPermission(role, "event:accept/decline");

  function onEdit() {
    navigate(`/events/${eventId}/edit`);
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
            <AcceptDialog option="accept" confirmFn={() => mutate("accept")}>
              <Button variant="secondary">Accept</Button>
            </AcceptDialog>
            <AcceptDialog option="decline" confirmFn={() => mutate("decline")}>
              <Button variant="destructive">Decline</Button>
            </AcceptDialog>
          </div>
        )}
      </div>
    </div>
  );
};
