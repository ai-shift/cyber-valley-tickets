import {
  approveMintTicket,
  approveSubmitEventRequest,
  mintTicket,
  mintTicketWithCategory,
  submitEventRequest,
  updateEvent as updateEventContract,
} from "@/shared/lib/web3";
import type { Account } from "thirdweb/wallets";

import type { EventDto } from "@/entities/event";
import type { Order, OrderTicket } from "@/entities/order";
import type { Socials } from "@/entities/user";
import { cleanEventLocal } from "@/features/event-form";
import { apiClient } from "@/shared/api";
import type { SendTx } from "@/shared/hooks";

export const purchase = async (
  sendTx: SendTx<unknown>,
  account: Account,
  order: Order,
  socials: Socials,
) => {
  const pickFetch: {
    [K in typeof order.type]: (
      sendTx: SendTx<unknown>,
      account: Account,
      order: Order,
      socials: Socials,
    ) => Promise<void>;
  } = {
    create_event: createEvent,
    buy_ticket: purchaseTicket,
    update_event: updateEvent,
  };

  await pickFetch[order.type](sendTx, account, order, socials);
};

const purchaseTicket = async (
  sendTx: SendTx<unknown>,
  account: Account,
  order: Order,
  socials: Socials,
) => {
  if (order.type !== "buy_ticket")
    throw new Error("There is no ticket in the order");

  const { data } = await getTicketCid(socials, order.ticket);

  if (!data || !data.cid) throw new Error("Can't fetch CID");

  const finalPrice = order.ticket.finalPrice ?? order.ticket.ticketPrice;
  const approve = approveMintTicket(account, BigInt(finalPrice));
  sendTx(approve);
  await approve;
  await new Promise((r) => setTimeout(r, 1000));

  const hasCategory = order.ticket.categoryId !== undefined;
  const tx = hasCategory
    ? mintTicketWithCategory(
        account,
        BigInt(order.ticket.eventId),
        BigInt(order.ticket.categoryId!),
        data.cid,
      )
    : mintTicket(account, BigInt(order.ticket.eventId), data.cid);

  sendTx(tx);
  await tx;
};

const updateEvent = async (
  sendTx: SendTx<unknown>,
  account: Account,
  order: Order,
  socials: Socials,
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

  const approve = approveSubmitEventRequest(account);
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
