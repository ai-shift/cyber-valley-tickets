import type { EventStatus } from "@/entities/event";
import { type Role, checkPermission } from "@/shared/lib/RBAC";
import {
  approveEvent,
  cancelEvent,
  closeEvent,
  declineEvent,
} from "@/shared/lib/web3";
import { AcceptDialog } from "@/shared/ui/AcceptDialog";
import { Loader } from "@/shared/ui/Loader";
import { ResultDialog } from "@/shared/ui/ResultDialog";
import { Button } from "@/shared/ui/button";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useActiveAccount } from "thirdweb/react";
import { useManageEventState } from "../model/slice";

type MaybeManageEventProps = {
  role: Role;
  status: EventStatus;
  eventId: number;
  canEdit: boolean;
};

type ManageAction = "decline" | "accept" | "close" | "cancel";

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
  const { optimisticSetEventStatus, optimisticEventsStatuses } =
    useManageEventState();
  const { mutate } = useMutation({
    mutationFn: async (action: ManageAction) => {
      console.log("got manage event action", action);
      console.log("eventId:", eventId, "account:", account?.address);
      if (account == null) throw new Error("Got null account");
      // TODO: Use the same type with EventStatus
      try {
        switch (action) {
          case "accept": {
            console.log("Calling approveEvent with eventId:", eventId);
            const txHash = await approveEvent(account, BigInt(eventId));
            console.log("approveEvent tx hash:", txHash);
            setModalInfo({
              title: "Event accepting was initiated",
              body: "Event will be accepted soon",
              error: false,
            });
            optimisticSetEventStatus(eventId, "approved");
            break;
          }
          case "decline": {
            console.log("Calling declineEvent with eventId:", eventId);
            const declineTxHash = await declineEvent(account, BigInt(eventId));
            console.log("declineEvent tx hash:", declineTxHash);
            setModalInfo({
              title: "Event declining was inititated",
              body: "Event will be declined soon",
              error: false,
            });
            optimisticSetEventStatus(eventId, "declined");
            break;
          }
          case "close": {
            console.log("Calling closeEvent with eventId:", eventId);
            const closeTxHash = await closeEvent(account, BigInt(eventId));
            console.log("closeEvent tx hash:", closeTxHash);
            setModalInfo({
              title: "Event finishing was initiated",
              body: "Event will be finished soon",
              error: false,
            });
            optimisticSetEventStatus(eventId, "closed");
            break;
          }
          case "cancel": {
            console.log("Calling cancelEvent with eventId:", eventId);
            const cancelTxHash = await cancelEvent(account, BigInt(eventId));
            console.log("cancelEvent tx hash:", cancelTxHash);
            setModalInfo({
              title: "Event cancelling was initiated",
              body: "Event will be cancelled soon",
              error: false,
            });
            optimisticSetEventStatus(eventId, "cancelled");
            break;
          }
          default:
            console.error("Unknown action received:", action);
            setModalInfo({
              title: "Failure",
              body: `Unknown action: ${action}`,
              error: true,
            });
        }
      } catch (e) {
        console.error("Transaction failed with error:", e);
        console.error("Error details:", {
          message: e instanceof Error ? e.message : "Unknown error",
          stack: e instanceof Error ? e.stack : undefined,
          raw: e,
        });

        // Extract meaningful error message
        let errorMessage = "Failed to send transaction";
        if (e instanceof Error) {
          if (e.message.includes("revert")) {
            errorMessage =
              "Transaction reverted by contract. You may not have permission to perform this action or the event is not in the correct state.";
          } else if (e.message.includes("insufficient funds")) {
            errorMessage = "Insufficient funds to complete transaction";
          } else if (e.message.includes("user rejected")) {
            errorMessage = "Transaction was rejected";
          } else {
            errorMessage = `Transaction failed: ${e.message.substring(0, 100)}`;
          }
        }

        setModalInfo({
          title: "Failure",
          body: errorMessage,
          error: true,
        });
      }
      setIsOpen(true);
    },
    onSuccess: (data) => {
      console.log("Mutation onSuccess callback - data:", data);
    },
    onError: (error) => {
      console.error("Mutation onError callback - error:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
    },
  });
  const navigate = useNavigate();

  status = optimisticEventsStatuses[eventId] || status;
  const canFinalize = status === "approved";
  const canControl =
    checkPermission(role, "event:accept/decline") && status === "submitted";

  function onEdit() {
    navigate(`/events/${eventId}/edit`);
  }

  if (status !== "submitted" && !canEdit && !canControl) return;
  if (!account) return <Loader />;

  return (
    <div className="flex flex-col items-center justify-center gap-7 py-10">
      <div className="w-3/4 flex flex-col justify-center gap-3">
        {canEdit && (
          <Button className="w-full" onClick={onEdit}>
            Edit
          </Button>
        )}
        {canControl && (
          <div className="flex justify-between gap-3">
            <AcceptDialog
              title="Are you sure you want to accept the event?"
              option="accept"
              confirmFn={() => mutate("accept")}
            >
              <Button className="w-full" variant="secondary">
                Accept
              </Button>
            </AcceptDialog>
            <AcceptDialog
              title="Are you sure you want to decline the event?"
              option="decline"
              confirmFn={() => mutate("decline")}
            >
              <Button className="w-full" variant="destructive">
                Decline
              </Button>
            </AcceptDialog>
          </div>
        )}
        {canFinalize && (
          <div className="flex justify-between gap-3">
            <AcceptDialog
              title="Are you sure you want to finalize the event?"
              option="accept"
              confirmFn={() => mutate("close")}
            >
              <Button className="w-full" variant="secondary">
                Finalize
              </Button>
            </AcceptDialog>
            <AcceptDialog
              title="Are you sure you want to fuck up the event?"
              option="accept"
              confirmFn={() => mutate("cancel")}
            >
              <Button className="w-full" variant="destructive">
                Fuck up
              </Button>
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
