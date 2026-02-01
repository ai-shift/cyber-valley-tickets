import {
  approveMintTicket,
  approveSubmitEventRequest,
  mintTicket,
  submitEventRequest,
  updateEvent as updateEventContract,
} from "@/shared/lib/web3";
import type { Account } from "thirdweb/wallets";

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
) => {
  const pickFetch: {
    [K in typeof order.type]: (
      sendTx: SendTx<unknown>,
      account: Account,
      order: Order,
      socials: Socials,
      referralAddress?: string,
    ) => Promise<void>;
  } = {
    create_event: createEvent,
    buy_ticket: purchaseTicket,
    update_event: updateEvent,
  };

  await pickFetch[order.type](sendTx, account, order, socials, referralAddress);
};

const purchaseTicket = async (
  sendTx: SendTx<unknown>,
  account: Account,
  order: Order,
  socials: Socials,
  referralAddress?: string,
) => {
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

  // Mint tickets for each allocation
  for (const allocation of order.ticket.allocations) {
    for (let i = 0; i < allocation.count; i++) {
      const { data } = await getTicketCid(socials, order.ticket);
      if (!data || !data.cid) throw new Error("Can't fetch CID");

      const tx = mintTicket(
        account,
        BigInt(order.ticket.eventId),
        BigInt(allocation.categoryId),
        data.cid,
        referralAddress,
      );
      sendTx(tx);
      await tx;
    }
  }

  // Clear referral after successful purchase
  if (referralAddress) {
    clearReferral();
  }
};

const updateEvent = async (
  sendTx: SendTx<unknown>,
  account: Account,
  order: Order,
  socials: Socials,
  _referralAddress?: string,
) => {
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
};

const createEvent = async (
  sendTx: SendTx<unknown>,
  account: Account,
  order: Order,
  socials: Socials,
  _referralAddress?: string,
) => {
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
  const approve = approveSubmitEventRequest(account, depositSize);
  sendTx(approve);
  await approve;
  console.log("Submit event request ERC20 transfer approved");
  await new Promise((r) => setTimeout(r, 1000));
  console.log("Starting submit transaction");
  const tx = submitEventRequest(
    account,
    BigInt(place),
    ticketPrice,
    BigInt(startTimeTimeStamp),
    daysAmount,
    eventData.cid,
  );
  sendTx(tx);
  await tx;
  cleanEventLocal();
};

const getSocialsCid = async (socials: Socials) => {
  console.log(socials);
  if (!socials) throw new Error("There is no socials in the order");
  return await apiClient.PUT("/api/ipfs/users/socials", {
    body: {
      //@ts-ignore
      network: socials.network.toLocaleLowerCase(),
      value: socials.value,
    },
  });
};

const getTicketCid = async (socials: Socials, ticket: OrderTicket) => {
  if (!socials) throw new Error("There is no socials in the order");
  if (!ticket)
    throw new Error(
      `Unexpected order type in a ticket flow: ${JSON.stringify(ticket)}`,
    );
  return await apiClient.PUT("/api/ipfs/tickets/meta", {
    body: {
      socials: {
        //@ts-ignore
        network: socials.network.toLocaleLowerCase(),
        value: socials.value,
      },
      eventid: ticket.eventId,
    },
  });
};

const getEventCid = async (event: EventDto, cid: string) => {
  const { title, description, image, website } = event;

  console.log(image);

  const formData = new FormData();
  formData.set("title", title);
  formData.set("description", description);
  formData.set("website", website);
  formData.set("cover", image);
  formData.set("socials_cid", cid);

  return await apiClient.PUT("/api/ipfs/events/meta", {
    //@ts-ignore
    body: formData,
  });
};
