import type { EventPlaceForm } from "@/features/place-form";
import { apiClient } from "@/shared/api";
import type { SendTx } from "@/shared/hooks";
import { createPlace, updatePlace } from "@/shared/lib/web3";
import type { Account } from "thirdweb/wallets";

export const upsertPlaceW3 = async (
  sendTx: SendTx<unknown>,
  place: EventPlaceForm,
  account?: Account,
  editPlaceId?: number,
) => {
  if (!account) throw "Account should be defined";
  const {
    maxTickets,
    minPrice,
    minTickets,
    minDays,
    daysBeforeCancel,
    title,
    locationUrl,
    available,
  } = place;

  const placeForm = new FormData();
  placeForm.append("title", title);
  placeForm.append("description", "foo");
  placeForm.append("location_url", locationUrl);

  const { data } = await apiClient.PUT("/api/ipfs/places/meta", {
    // @ts-ignore
    body: placeForm,
  });

  if (!data || !data.cid) throw new Error("No cid was recieved");

  let promise: Promise<unknown>;
  if (editPlaceId) {
    promise = updatePlace(
      account,
      BigInt(editPlaceId),
      maxTickets,
      minTickets,
      minPrice,
      daysBeforeCancel,
      minDays,
      available,
      data.cid,
    );
  } else {
    promise = createPlace(
      account,
      maxTickets,
      minTickets,
      minPrice,
      daysBeforeCancel,
      minDays,
      available,
      data.cid,
    );
  }
  sendTx(promise);
  await promise;
};
