import { useState } from "react";
import { useNavigate } from "react-router";

import { useAuthSlice } from "@/app/providers";
import { useOrderStore } from "@/entities/order";
import { checkPermission } from "@/shared/lib/RBAC";
import { Button } from "@/shared/ui/button";

import { isEventPassed } from "../lib/eventPassed";
import { type CategoryOption, CategorySelect } from "./CategorySelect";
import { Redeem } from "./Redeem";
import { ShowTicket } from "./ShowTicket";

import type { Event } from "@/entities/event";
import type { User } from "@/entities/user";

type TicketProps = {
  user: User;
  event: Event;
};

export const Ticket: React.FC<TicketProps> = ({ user, event }) => {
  const navigate = useNavigate();
  const { user: authUser } = useAuthSlice();
  const { setTicketOrder } = useOrderStore();
  const [showCategorySelect, setShowCategorySelect] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryOption | null>(null);

  if (event.status !== "approved") return null;

  const tickets = user.tickets.filter((ticket) => ticket.eventId === event.id);
  const hasPassed = isEventPassed(event.startDateTimestamp, event.daysAmount);
  const isCreator = user.address === event.creator.address;

  function handleGetTicketClick() {
    setShowCategorySelect(true);
  }

  function handleCategorySelect(category: CategoryOption | null) {
    setSelectedCategory(category);
  }

  function handleContinueToPurchase() {
    if (!authUser) return;

    // Check if user has socials
    if (authUser.socials.length === 0) {
      navigate("/socials");
      return;
    }

    // Calculate final price based on category
    const finalPrice = selectedCategory
      ? event.ticketPrice -
        (event.ticketPrice * selectedCategory.discount) / 10000
      : event.ticketPrice;

    // Set the order with selected category
    setTicketOrder({
      eventId: event.id,
      eventTitle: event.title,
      ticketPrice: event.ticketPrice,
      categoryId: selectedCategory?.categoryId,
      categoryName: selectedCategory?.name,
      discount: selectedCategory?.discount,
      finalPrice: finalPrice,
    });

    // Navigate to purchase page
    navigate("/purchase");
  }

  if (checkPermission(user.role, "ticket:redeem"))
    return <Redeem eventId={event.id} />;
  if (isCreator) return null;

  return (
    <>
      {tickets.length > 0 ? (
        <ShowTicket hasPassed={hasPassed} tickets={tickets} />
      ) : showCategorySelect ? (
        <div className="space-y-4 bg-popover border border-input p-4 shadow-lg">
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
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              disabled={hasPassed}
              onClick={handleContinueToPurchase}
            >
              Continue to Purchase
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
    </>
  );
};
