import type { CategoryInput } from "@/entities/event";
import {
  approveMintTicket,
  approveSubmitEventRequest,
  mintTickets,
  submitEventRequest,
  updateEvent as updateEventContract,
} from "@/shared/lib/web3";
import type { Account } from "thirdweb/wallets";

import { useAuthSlice } from "@/app/providers";
import type { EventDto } from "@/entities/event";
import type { Order, OrderTicket } from "@/entities/order";
import { getPlaceById } from "@/entities/place";
import type { Socials } from "@/entities/user";
import { cleanEventLocal } from "@/features/event-form";
import { clearReferral } from "@/features/referral";
import { apiClient } from "@/shared/api";
import type { SendTx } from "@/shared/hooks";

export const purchase = async (
  sendTx: SendTx<unknown>,
  account: Account,
  order: Order,
  socials: Socials,
  referralAddress?: string,
): Promise<string | undefined> => {
  const pickFetch: {
    [K in typeof order.type]: (
      sendTx: SendTx<unknown>,
      account: Account,
      order: Order,
      socials: Socials,
      referralAddress?: string,
    ) => Promise<string | undefined>;
  } = {
    create_event: createEvent,
    buy_ticket: purchaseTicket,
    update_event: updateEvent,
  };

  return await pickFetch[order.type](
    sendTx,
    account,
    order,
    socials,
    referralAddress,
  );
};

const purchaseTicket = async (
  sendTx: SendTx<unknown>,
  account: Account,
  order: Order,
  socials: Socials,
  referralAddress?: string,
): Promise<undefined> => {
  if (order.type !== "buy_ticket")
    throw new Error("There is no ticket in the order");

  // Validate allocations
  if (!order.ticket.allocations || order.ticket.allocations.length === 0) {
    throw new Error("Please select at least one ticket category");
  }

  const totalAllocated = order.ticket.allocations.reduce(
    (sum, a) => sum + a.count,
    0,
  );
  if (totalAllocated === 0) {
    throw new Error("Please select at least one ticket");
  }

  // Calculate total price from allocations
  const totalPrice = order.ticket.allocations.reduce(
    (sum, a) => sum + a.count * a.finalPricePerTicket,
    0,
  );

  // Approve total price once
  const approve = approveMintTicket(account, BigInt(totalPrice));
  sendTx(approve);
  await approve;
  await new Promise((r) => setTimeout(r, 1000));

  // Get order CID once for all tickets
  const { data } = await getOrderCid(socials, order.ticket, account.address);
  if (!data || !data.cid) throw new Error("Can't fetch CID");

  // Mint tickets for each allocation in batch
  for (const allocation of order.ticket.allocations) {
    const tx = mintTickets(
      account,
      BigInt(order.ticket.eventId),
      BigInt(allocation.categoryId),
      BigInt(allocation.count),
      data.cid,
      referralAddress,
    );
    sendTx(tx);
    await tx;
  }

  // Clear referral after successful purchase
  if (referralAddress) {
    clearReferral();
  }
  return undefined;
};

const updateEvent = async (
  sendTx: SendTx<unknown>,
  account: Account,
  order: Order,
  socials: Socials,
  _referralAddress?: string,
): Promise<undefined> => {
  if (order.type !== "update_event")
    throw new Error("There is no event in the order");

  const { data: socialsData } = await getSocialsCid(socials);
  if (!socialsData || !socialsData.cid) throw new Error("Can't fetch CID");

  const { data: eventData } = await getEventCid(order.event, socialsData.cid);

  if (!eventData || !eventData.cid)
    throw new Error("Can't fetch event meta CID");

  const { id, place, ticketPrice, startTimeTimeStamp, daysAmount } =
    order.event;

  const tx = updateEventContract(
    account,
    BigInt(id),
    BigInt(place),
    ticketPrice,
    BigInt(startTimeTimeStamp),
    daysAmount,
    eventData.cid,
  );
  sendTx(tx);
  await tx;
  cleanEventLocal();
  return undefined;
};

const createEvent = async (
  sendTx: SendTx<unknown>,
  account: Account,
  order: Order,
  socials: Socials,
  _referralAddress?: string,
): Promise<string | undefined> => {
  if (order.type !== "create_event")
    throw new Error("There is no event in the order");
  if (!socials) throw new Error("There is no socials in the order");

  const { place, ticketPrice, startTimeTimeStamp, daysAmount } = order.event;

  const { data: socialsData } = await getSocialsCid(socials);
  if (!socialsData || !socialsData.cid) throw new Error("Can't fetch CID");

  const { data: eventData } = await getEventCid(order.event, socialsData.cid);

  if (!eventData || !eventData.cid)
    throw new Error("Can't fetch event meta CID");

  // Fetch place data to get the deposit size
  const { data: placeData } = await getPlaceById(Number(place));
  if (!placeData) throw new Error("Can't fetch place data");

  if (
    placeData.eventDepositSize === undefined ||
    placeData.eventDepositSize === null
  ) {
    throw new Error("Event place deposit size is not set");
  }
  if (placeData.eventDepositSize <= 0) {
    throw new Error("Event place deposit size must be greater than 0");
  }
  const depositSize = BigInt(placeData.eventDepositSize);
  if (import.meta.env.DEV) {
    console.log("Event creation params:", {
      place,
      ticketPrice,
      startTimeTimeStamp,
      daysAmount,
      depositSize: depositSize.toString(),
      eventDepositSize: placeData.eventDepositSize,
    });
  }
  const approve = approveSubmitEventRequest(account, depositSize);
  sendTx(approve);
  await approve;
  if (import.meta.env.DEV) {
    console.log("Submit event request ERC20 transfer approved");
  }
  await new Promise((r) => setTimeout(r, 1000));
  if (import.meta.env.DEV) {
    console.log("Starting submit transaction");
  }
  // Convert categories to contract format
  const contractCategories: CategoryInput[] = order.event.categories.map(
    (cat) => ({
      name: cat.name,
      // Form stores discount in percent; contract expects basis points.
      discountPercentage: Math.round(cat.discount * 100),
      quota: cat.quota,
      hasQuota: cat.quota > 0, // quota === 0 means unlimited
    }),
  );

  if (import.meta.env.DEV) {
    console.log("Creating event with categories:", contractCategories);
  }

  const result = submitEventRequest(
    account,
    BigInt(place),
    ticketPrice,
    BigInt(startTimeTimeStamp),
    daysAmount,
    eventData.cid,
    contractCategories,
  );
  sendTx(result);
  const { txHash } = await result;
  cleanEventLocal();
  return txHash;
};

const getSocialsCid = async (socials: Socials) => {
  if (import.meta.env.DEV) {
    console.log(socials);
  }
  if (!socials) throw new Error("There is no socials in the order");
  return await apiClient.PUT("/api/ipfs/users/socials", {
    body: {
      //@ts-ignore
      network: socials.network.toLocaleLowerCase(),
      value: socials.value,
    },
  });
};

const getOrderCid = async (
  socials: Socials,
  ticket: OrderTicket,
  buyerAddress: string,
) => {
  if (!socials) throw new Error("There is no socials in the order");
  if (!ticket)
    throw new Error(
      `Unexpected order type in a ticket flow: ${JSON.stringify(ticket)}`,
    );

  const totalTickets = ticket.allocations.reduce((sum, a) => sum + a.count, 0);
  const totalPrice = ticket.allocations.reduce(
    (sum, a) => sum + a.count * a.finalPricePerTicket,
    0,
  );

  return await apiClient.PUT("/api/ipfs/orders/meta", {
    body: {
      event_id: ticket.eventId,
      buyer_address: buyerAddress,
      socials: {
        //@ts-ignore
        network: socials.network.toLocaleLowerCase(),
        value: socials.value,
      },
      tickets: ticket.allocations.map((a) => ({
        categoryId: a.categoryId,
        categoryName: a.categoryName,
        price: a.finalPricePerTicket,
        quantity: a.count,
      })),
      total_tickets: totalTickets,
      total_price: totalPrice,
      currency: "USDT",
      referral_data: "",
    },
  });
};

const getEventCid = async (event: EventDto, cid: string) => {
  const { title, description, image, website } = event;
  const address = useAuthSlice.getState().address;
  if (!address) {
    throw new Error("Wallet address is required to upload event metadata");
  }

  if (import.meta.env.DEV) {
    console.log(image);
  }

  const formData = new FormData();
  formData.set("address", address);
  formData.set("title", title);
  formData.set("description", description);
  formData.set("website", website || "");
  formData.set("cover", image);
  formData.set("socials_cid", cid);

  return await apiClient.PUT("/api/ipfs/events/meta", {
    //@ts-ignore
    body: formData,
  });
};
