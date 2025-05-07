import type { EventPlaceForm } from "@/features/place-form";
import { apiClient } from "@/shared/api";
import { createPlace } from "@/shared/lib/web3";

export const create = async (place: EventPlaceForm) => {
  const { maxTickets, minPrice, minTickets, minDays, daysBeforeCancel, title } =
    place;

  const placeForm = new FormData();
  placeForm.append("title", title);
  placeForm.append("description", "foo");

  const { data } = await apiClient.PUT("/api/ipfs/places/meta", {
    // @ts-ignore
    body: placeForm,
  });

  if (!data || !data.cid) throw new Error("No cid was recieved");

  await createPlace(
    maxTickets,
    minTickets,
    minPrice,
    daysBeforeCancel,
    minDays,
    data.cid,
  );
};
