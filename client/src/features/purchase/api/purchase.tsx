import { mintTicket, submitEventRequest } from "@/shared/lib/web3";
import type { Account } from "thirdweb/wallets";

import type { Order } from "@/entities/order";
import { apiClient } from "@/shared/api";

export const purchase = async (account: Account, order: Order) => {
  const pickFetch: {
    [K in typeof order.type]: (account: Account, order: Order) => Promise<void>;
  } = {
    create_event: purchaseEvent,
    buy_ticket: purchaseTicket,
  };

  await pickFetch[order.type](account, order);
};

const purchaseTicket = async (account: Account, order: Order) => {
  if (order.type !== "buy_ticket")
    throw new Error("There is no ticket in the order");
  if (!order.socials) throw new Error("There is no socials in the order");

  const { data } = await apiClient.PUT("/api/ipfs/users/socials", {
    body: {
      //@ts-ignore
      network: order.socials.type.toLocaleLowerCase(),
      value: order.socials.contactInfo,
    },
  });

  if (!data || !data.cid) throw new Error("Can't fetch CID");

  await mintTicket(
    account,
    order.ticket.ticketPrice,
    order.ticket.eventId,
    data.cid,
  );
};

const purchaseEvent = async (account: Account, order: Order) => {
  if (order.type !== "create_event")
    throw new Error("There is no event in the order");
  if (!order.socials) throw new Error("There is no socials in the order");

  const {
    place,
    ticketPrice,
    startTimeTimeStamp,
    daysAmount,
    title,
    description,
    image,
  } = order.event;

  console.log(order.socials);

  const { data: socialsData } = await apiClient.PUT("/api/ipfs/users/socials", {
    body: {
      //@ts-ignore
      network: order.socials.type.toLocaleLowerCase(),
      value: order.socials.contactInfo,
    },
  });

  if (!socialsData || !socialsData.cid) throw new Error("Can't fetch CID");

  const formData = new FormData();
  formData.set("title", title);
  formData.set("description", description);
  formData.set("cover", image);
  formData.set("socials_cid", socialsData.cid);

  const { data: eventData } = await apiClient.PUT("/api/ipfs/events/meta", {
    //@ts-ignore
    body: formData,
  });

  console.log(eventData);
  if (!eventData || !eventData.cid)
    throw new Error("Can't fetch event meta CID");

  await submitEventRequest(
    account,
    place,
    ticketPrice,
    startTimeTimeStamp,
    daysAmount,
    eventData.cid,
  );
};
