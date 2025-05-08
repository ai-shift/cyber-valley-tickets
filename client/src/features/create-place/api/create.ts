import type { EventPlaceForm } from "@/features/place-form";
import { apiClient } from "@/shared/api";
import { createPlace } from "@/shared/lib/web3";
import type { Account } from "thirdweb/wallets";

export const create = async (place: EventPlaceForm, account?: Account) => {
  if (!account) throw "Account should be defined";
  const { maxTickets, minPrice, minTickets, minDays, daysBeforeCancel, title } =
    place;

  const placeForm = new FormData();
  placeForm.append("title", title);
  placeForm.append("description", "foo");

  const { data } = await apiClient.PUT("/api/ipfs/places/meta", {
    // @ts-ignore
    body: placeForm,
  });

  console.log("Got places meta response", data);
  if (!data || !data.cid) throw new Error("No cid was recieved");

  console.log("Acount", account);
  const tx = await createPlace(
    account,
    maxTickets,
    minTickets,
    minPrice,
    daysBeforeCancel,
    minDays,
    data.cid,
  );
  console.log("Tx sent", tx);
  console.log("Mutate finished");
};
