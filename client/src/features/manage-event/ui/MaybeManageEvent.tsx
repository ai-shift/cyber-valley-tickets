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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useActiveAccount } from "thirdweb/react";
import { useManageEventState } from "../model/slice";
import { DisplayUser } from "@/features/display-user";

type MaybeManageEventProps = {
  roles: Role[];
  status: EventStatus;
  eventId: number;
  canEdit: boolean;
};

type ManageAction = "decline" | "accept" | "close" | "cancel";

type DistributionProfile = {
  id: number;
  ownerAddress: string;
  recipients: { address: string; share: number }[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export const MaybeManageEvent: React.FC<MaybeManageEventProps> = ({
  roles,
  status,
  eventId,
  canEdit,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [modalInfo, setModalInfo] = useState({
    title: "",
    body: "",
    error: false,
  });
  const account = useActiveAccount();
  const { optimisticSetEventStatus, optimisticEventsStatuses } =
    useManageEventState();

  // Fetch distribution profiles owned by the current user
  const { data: profiles, isLoading: isProfilesLoading } = useQuery({
    queryKey: ["distribution-profiles"],
    queryFn: async () => {
      const response = await fetch("/api/distribution-profiles/");
      if (!response.ok) throw new Error("Failed to fetch profiles");
      return response.json() as Promise<DistributionProfile[]>;
    },
    enabled: !!account,
  });

  // Preselect the first profile when profiles are loaded
  useEffect(() => {
    if (profiles && profiles.length > 0 && !selectedProfileId) {
      setSelectedProfileId(String(profiles[0].id));
    }
  }, [profiles, selectedProfileId]);

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
            const txHash = await approveEvent(
              account,
              BigInt(eventId),
              BigInt(selectedProfileId),
            );
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
    checkPermission(roles, "event:accept/decline") && status === "submitted";

  function onEdit() {
    navigate(`/events/${eventId}/edit`);
  }

  const handleAcceptClick = () => {
    // Open profile selector dialog
    setIsProfileDialogOpen(true);
  };

  const handleProfileConfirm = () => {
    if (!selectedProfileId) {
      setModalInfo({
        title: "Error",
        body: "Please select a distribution profile",
        error: true,
      });
      setIsOpen(true);
      return;
    }
    setIsProfileDialogOpen(false);
    mutate("accept");
  };

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
            <Button
              className="w-full"
              variant="secondary"
              onClick={handleAcceptClick}
            >
              Accept
            </Button>
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

      {/* Profile Selection Dialog */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Distribution Profile</DialogTitle>
            <DialogDescription>
              Choose a distribution profile for revenue sharing when approving
              this event.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isProfilesLoading ? (
              <div className="flex justify-center py-4">
                <Loader />
              </div>
            ) : profiles && profiles.length > 0 ? (
              <>
                <Select
                  value={selectedProfileId}
                  onValueChange={setSelectedProfileId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a profile..." />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={String(profile.id)}>
                        Profile #{profile.id} ({profile.recipients.length}{" "}
                        recipients)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Selected Profile Details */}
                {selectedProfileId && (
                  <div className="mt-4 p-4 space-y-3">
                    {(() => {
                      const profile = profiles.find(
                        (p) => String(p.id) === selectedProfileId
                      );
                      if (!profile) return null;
                      const totalShares = profile.recipients.reduce(
                        (sum, r) => sum + r.share,
                        0
                      );
                      return (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold">
                              Profile #{profile.id}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {profile.recipients.length} recipient(s)
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            Owner: <DisplayUser address={profile.ownerAddress || ""} className="text-xs" />
                          </div>

                          {/* Recipients Table */}
                          <div className="mt-3">
                            <table className="w-full text-sm">
                              <thead>
                                <tr>
                                  <th className="text-left py-1 text-xs text-muted-foreground">
                                    Recipient
                                  </th>
                                  <th className="text-right py-1 text-xs text-muted-foreground">
                                    Share
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {profile.recipients?.map((recipient, idx) => (
                                  <tr key={idx}>
                                    <td className="py-2 font-mono text-xs">
                                      {recipient.address?.slice(0, 6)}...
                                      {recipient.address?.slice(-4)}
                                    </td>
                                    <td className="py-2 text-right">
                                      {(recipient.share / 100).toFixed(0)}%
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Platform Fees Info */}
                          <div className="mt-3 pt-3">
                            <div className="text-xs text-muted-foreground">
                              <strong>Platform Fees (Fixed):</strong>
                            </div>
                            <div className="flex justify-between text-xs mt-1">
                              <span>CyberiaDAO:</span>
                              <span>10%</span>
                            </div>
                            <div className="flex justify-between text-xs mt-1">
                              <span>CVE PT PMA:</span>
                              <span>5%</span>
                            </div>
                            <div className="flex justify-between text-sm font-semibold mt-2 pt-1">
                              <span>Your Share:</span>
                              <span>{totalShares / 100}% of 85%</span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No distribution profiles found. Please create a profile first.
              </p>
            )}
          </div>
          <DialogFooter className="gap-3">
            <Button
              variant="ghost"
              onClick={() => setIsProfileDialogOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            {profiles && profiles.length > 0 ? (
              <Button
                onClick={handleProfileConfirm}
                disabled={!selectedProfileId || isProfilesLoading}
                className="flex-1"
              >
                Approve
              </Button>
            ) : (
              <Link
                to="/account/distribution-profiles/create"
                onClick={() => setIsProfileDialogOpen(false)}
              >
                <Button>Create One</Button>
              </Link>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
