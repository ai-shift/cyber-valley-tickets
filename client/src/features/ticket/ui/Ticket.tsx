import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

import { useAuthSlice } from "@/app/providers";
import { apiClient } from "@/shared/api";
import { useSendTx } from "@/shared/hooks";
import { checkPermission } from "@/shared/lib/RBAC";
import {
  approveMintTicket,
  hasEnoughtTokens,
  mintTicket,
  mintTicketWithCategory,
} from "@/shared/lib/web3";
import { Loader } from "@/shared/ui/Loader";
import { ResultDialog } from "@/shared/ui/ResultDialog";
import { Button } from "@/shared/ui/button";
import { useMutation } from "@tanstack/react-query";
import { useActiveAccount } from "thirdweb/react";

import { isEventPassed } from "../lib/eventPassed";
import { type CategoryOption, CategorySelect } from "./CategorySelect";
import { Redeem } from "./Redeem";
import { ShowTicket } from "./ShowTicket";

import type { Event } from "@/entities/event";
import type { User } from "@/entities/user";
import type { Socials } from "@/entities/user";

type TicketProps = {
  user: User;
  event: Event;
};

export const Ticket: React.FC<TicketProps> = ({ user, event }) => {
  const navigate = useNavigate();
  const { user: authUser } = useAuthSlice();
  const [isOpen, setIsOpen] = useState(false);
  const [showCategorySelect, setShowCategorySelect] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryOption | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const account = useActiveAccount();
  const cardRef = useRef<HTMLDivElement>(null);
  const { sendTx, data: txHash } = useSendTx();

  if (event.status !== "approved") return null;

  const ticket = user.tickets.find((ticket) => ticket.eventId === event.id);
  const hasPassed = isEventPassed(event.startDateTimestamp, event.daysAmount);
  const isCreator = user.address === event.creator.address;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setShowCategorySelect(false);
      }
    }

    if (showCategorySelect) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showCategorySelect]);

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      if (!account || !authUser) {
        throw new Error("Account or user are missing");
      }

      const finalPrice = selectedCategory
        ? event.ticketPrice -
          (event.ticketPrice * selectedCategory.discount) / 10000
        : event.ticketPrice;

      // Check tokens
      const { enoughTokens } = await hasEnoughtTokens(
        account,
        BigInt(finalPrice),
      );
      if (!enoughTokens) {
        throw new Error("Not enough tokens");
      }

      // Get socials
      if (authUser.socials.length === 0) {
        navigate("/socials");
        return;
      }
      const socials = authUser.socials[0] as Socials;

      // Get ticket CID
      const { data } = await apiClient.PUT("/api/ipfs/tickets/meta", {
        body: {
          socials: {
            network: socials.network.toLowerCase() as Socials["network"],
            value: socials.value,
          },
          eventid: event.id,
        },
      });

      if (!data || !data.cid) throw new Error("Can't fetch CID");

      // Approve tokens
      const approve = approveMintTicket(account, BigInt(finalPrice));
      sendTx(approve);
      await approve;
      await new Promise((r) => setTimeout(r, 1000));

      // Mint ticket
      const hasCategory = selectedCategory !== null;
      const tx = hasCategory
        ? mintTicketWithCategory(
            account,
            BigInt(event.id),
            BigInt(selectedCategory.categoryId),
            data.cid,
          )
        : mintTicket(account, BigInt(event.id), data.cid);

      sendTx(tx);
      await tx;
    },
    onSuccess: () => {
      setIsSuccess(true);
    },
    onError: (err) => {
      console.error("Purchase failed:", err);
      if (err instanceof Error && err.message.includes("Not enough tokens")) {
        setIsOpen(true);
      }
    },
  });

  function handleGetTicketClick() {
    setShowCategorySelect(true);
  }

  function handleCategorySelect(category: CategoryOption | null) {
    setSelectedCategory(category);
  }

  function handlePurchase() {
    purchaseMutation.mutate();
  }

  if (checkPermission(user.role, "ticket:redeem"))
    return <Redeem eventId={event.id} />;
  if (isCreator) return null;

  return (
    <>
      {ticket ? (
        <ShowTicket hasPassed={hasPassed} ticket={ticket} />
      ) : showCategorySelect ? (
        <div
          ref={cardRef}
          className="space-y-4 bg-popover border border-input p-4 shadow-lg"
        >
          <CategorySelect
            eventId={event.id}
            ticketPrice={event.ticketPrice}
            selectedCategoryId={selectedCategory?.categoryId ?? null}
            onCategorySelect={handleCategorySelect}
          />
          <div className="flex gap-2">
            <Button
              filling="outline"
              className="flex-1"
              onClick={() => setShowCategorySelect(false)}
              disabled={purchaseMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              disabled={hasPassed || purchaseMutation.isPending}
              onClick={handlePurchase}
            >
              {purchaseMutation.isPending ? <Loader /> : "Purchase"}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          className="w-full"
          disabled={hasPassed}
          onClick={handleGetTicketClick}
        >
          Get ticket
        </Button>
      )}
      <ResultDialog
        open={isOpen}
        setOpen={setIsOpen}
        title="Not enough tokens"
        body=""
        onConfirm={() => {
          setIsOpen(false);
        }}
        failure={true}
      />
      <ResultDialog
        open={isSuccess}
        setOpen={setIsSuccess}
        title="Payment successful!"
        body="You will receive your ticket within several minutes."
        onConfirm={() => {
          setIsSuccess(false);
          setShowCategorySelect(false);
        }}
        txHash={txHash as string}
      />
    </>
  );
};
