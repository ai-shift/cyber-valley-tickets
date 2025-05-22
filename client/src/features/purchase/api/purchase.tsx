import {
  mintTicket,
  submitEventRequest,
  updateEvent as updateEventContract,
} from "@/shared/lib/web3";
import type { Account } from "thirdweb/wallets";

import type { EventDto } from "@/entities/event";
import type { Order } from "@/entities/order";
import { apiClient } from "@/shared/api";

export const purchase = async (account: Account, order: Order) => {
  const pickFetch: {
    [K in typeof order.type]: (account: Account, order: Order) => Promise<void>;
  } = {
    create_event: purchaseEvent,
    buy_ticket: purchaseTicket,
    update_event: updateEvent,
  };

  await pickFetch[order.type](account, order);
};

const purchaseTicket = async (account: Account, order: Order) => {
  if (order.type !== "buy_ticket")
    throw new Error("There is no ticket in the order");

  const { data } = await getSocialsCid(order);

  if (!data || !data.cid) throw new Error("Can't fetch CID");

  const txHash = await mintTicket(
    account,
    BigInt(order.ticket.ticketPrice),
    BigInt(order.ticket.eventId),
    data.cid,
  );
  console.log("Tx hash", txHash);
};

const updateEvent = async (account: Account, order: Order) => {
  if (order.type !== "update_event")
    throw new Error("There is no event in the order");

  const { data: socialsData } = await getSocialsCid(order);
  if (!socialsData || !socialsData.cid) throw new Error("Can't fetch CID");

  const { data: eventData } = await getEventCid(order.event, socialsData.cid);

  if (!eventData || !eventData.cid)
    throw new Error("Can't fetch event meta CID");

  const { id, place, ticketPrice, startTimeTimeStamp, daysAmount } =
    order.event;

  await updateEventContract(
    account,
    BigInt(id),
    BigInt(place),
    ticketPrice,
    BigInt(startTimeTimeStamp),
    daysAmount,
    eventData.cid,
  );
};

const purchaseEvent = async (account: Account, order: Order) => {
  if (order.type !== "create_event")
    throw new Error("There is no event in the order");
  if (!order.socials) throw new Error("There is no socials in the order");

  const { place, ticketPrice, startTimeTimeStamp, daysAmount } = order.event;

  const { data: socialsData } = await getSocialsCid(order);
  if (!socialsData || !socialsData.cid) throw new Error("Can't fetch CID");

  const { data: eventData } = await getEventCid(order.event, socialsData.cid);

  if (!eventData || !eventData.cid)
    throw new Error("Can't fetch event meta CID");

  await submitEventRequest(
    account,
    BigInt(place),
    ticketPrice,
    BigInt(startTimeTimeStamp),
    daysAmount,
    eventData.cid,
  );
};

const getSocialsCid = async (order: Order) => {
  if (!order.socials) throw new Error("There is no socials in the order");
  return await apiClient.PUT("/api/ipfs/users/socials", {
    body: {
      //@ts-ignore
      network: order.socials.type.toLocaleLowerCase(),
      value: order.socials.contactInfo,
    },
  });
};

const getEventCid = async (event: EventDto, cid: string) => {
  const { title, description, image } = event;

  const formData = new FormData();
  formData.set("title", title);
  formData.set("description", description);
  formData.set("cover", image);
  formData.set("socials_cid", cid);

  return await apiClient.PUT("/api/ipfs/events/meta", {
    //@ts-ignore
    body: formData,
  });
};
