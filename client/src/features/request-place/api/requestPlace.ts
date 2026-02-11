import type { Point } from "@/entities/geodata";
import type { EventPlaceForm } from "@/features/place-form";
import { apiClient } from "@/shared/api";
import { parseUsdt } from "@/shared/lib/money/usdt";
import { submitEventPlaceRequest } from "@/shared/lib/web3";
import type { Account } from "thirdweb/wallets";

export const requestPlace = async (account: Account, place: EventPlaceForm) => {
  const {
    title,
    geometry,
    daysBeforeCancel,
    minDays,
    minPrice,
    minTickets,
    maxTickets,
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
  const depositUnits = parseUsdt(eventDepositSize);
  placeForm.append("eventDepositSize", depositUnits.toString());

  const { data } = await apiClient.PUT("/api/ipfs/places/meta", {
    // @ts-ignore
    body: placeForm,
  });

  if (!data || !data.cid) throw new Error("No cid was recieved");

  const minPriceUnits = parseUsdt(minPrice);
  const txHash = await submitEventPlaceRequest(
    account,
    maxTickets,
    minTickets,
    minPriceUnits,
    daysBeforeCancel,
    minDays,
    available,
    data.cid,
    depositUnits,
  );
  return txHash;
};
