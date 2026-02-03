import type { Point } from "@/entities/geodata";
import type { EventPlaceForm } from "@/features/place-form";
import { apiClient } from "@/shared/api";
import type { SendTx } from "@/shared/hooks";
import { submitEventPlaceRequest, updatePlace } from "@/shared/lib/web3";
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
    geometry,
    available,
    eventDepositSize,
  } = place;

  if (!geometry) {
    throw Error("Missing coordinates for the event place");
  }

  const formatedGeodata: Point = {
    type: "point",
    name: title,
    coordinates: [geometry],
    iconUrl: "",
  };

  const placeForm = new FormData();
  placeForm.append("title", title);
  placeForm.append("description", "foo");
  placeForm.append("geometry", JSON.stringify(formatedGeodata));
  placeForm.append("eventDepositSize", eventDepositSize.toString());

  const { data } = await apiClient.PUT("/api/ipfs/places/meta", {
    // @ts-ignore
    body: placeForm,
  });

  if (!data || !data.cid) throw new Error("No cid was recieved");

  let promise: Promise<unknown>;
  if (editPlaceId != null) {
    console.log("editing existing event place with id", editPlaceId);
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
      eventDepositSize,
    );
  } else {
    promise = submitEventPlaceRequest(
      account,
      maxTickets,
      minTickets,
      minPrice,
      daysBeforeCancel,
      minDays,
      available,
      data.cid,
      eventDepositSize,
    );
  }
  sendTx(promise);
  await promise;
};
