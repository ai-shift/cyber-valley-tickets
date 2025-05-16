import type { EventPlace } from "@/entities/place";

export type EventPlaceForm = Omit<EventPlace, "id" | "isUsed">;
