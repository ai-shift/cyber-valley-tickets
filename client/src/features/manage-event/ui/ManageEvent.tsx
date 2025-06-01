import type { EventStatus } from "@/entities/event";
import { type Role, checkPermission } from "@/shared/lib/RBAC";
import { approveEvent, declineEvent } from "@/shared/lib/web3";
import { Loader } from "@/shared/ui/Loader";
import { ResultDialog } from "@/shared/ui/ResultDialog";
import { Button } from "@/shared/ui/button";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
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
  const [isOpen, setIsOpen] = useState(false);
  const [modalInfo, setModalInfo] = useState({
    title: "",
    body: "",
    error: false,
  });
  const account = useActiveAccount();
  const { mutate } = useMutation({
    mutationFn: async (action: ManageAction) => {
      if (account == null) throw new Error("Got null account");
      switch (action) {
        case "accept":
          await approveEvent(account, BigInt(eventId));
          setModalInfo({
            title: "Event accepting was initiated",
            body: "Event will be accepted soon",
            error: false,
          });
          break;
        case "decline":
          await declineEvent(account, BigInt(eventId));
          setModalInfo({
            title: "Event declining was inititated",
            body: "Event will be declined soon",
            error: false,
          });
          break;
        default:
          setModalInfo({
            title: "Failure",
            body: `Unknown action: ${action}`,
            error: true,
          });
      }
      setIsOpen(true);
    },
    onSuccess: console.log,
    onError: console.error,
  });
  const navigate = useNavigate();

  const canControl =
    checkPermission(role, "event:accept/decline") && status === "submitted";

  function onEdit() {
    navigate(`/events/${eventId}/edit`);
  }

  if (status !== "submitted" && !canEdit && !canControl) return;
  if (!account) return <Loader />;

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
        <ResultDialog
          open={isOpen}
          setOpen={setIsOpen}
          title={modalInfo.title}
          body={modalInfo.body}
          onConfirm={() => {
            setIsOpen(false);
          }}
          failure={modalInfo.error}
        />
      </div>
    </div>
  );
};
