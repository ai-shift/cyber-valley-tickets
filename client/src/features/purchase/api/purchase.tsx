import { mintTicket, submitEventRequest } from "@/shared/lib/web3";

import type { Order } from "@/entities/order";
import { apiClient } from "@/shared/api";

export const purchase = async (order: Order) => {
  const pickFetch: {
    [K in typeof order.type]: (order: Order) => Promise<void>;
  } = {
    create_event: purchaseEvent,
    buy_ticket: purchaseTicket,
  };

  pickFetch[order.type](order);
};

const purchaseTicket = async (order: Order) => {
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

  await mintTicket(order.ticket.eventId, data.cid);
};

const purchaseEvent = async (order: Order) => {
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

  const { data: eventData } = await apiClient.PUT("/api/ipfs/events/meta", {
    //@ts-ignore
    body: formData,
  });

  console.log(eventData);

  //   await submitEventRequest(place, ticketPrice, startTimeTimeStamp, daysAmount, );
};
