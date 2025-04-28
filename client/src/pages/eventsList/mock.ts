import type { Event } from "@/entities/event/model/event";

type EventMock = Pick<
  Event,
  "imageUrl" | "place" | "startDate" | "durationDays" | "title"
>;

export const events: EventMock[] = [
  {
    imageUrl: "https://picsum.photos/400/300",
    place: "Amos Rex Museum, Helsinki",
    startDate: "2025-05-22",
    durationDays: 10,
    title: "Modern Art Retrospective",
  },
  {
    imageUrl: "https://picsum.photos/400/300",
    place: "Helsinki Archipelago",
    startDate: "2025-06-01",
    durationDays: 2,
    title: "Annual Baltic Sea Race",
  },
  {
    imageUrl: "https://picsum.photos/400/300",
    place: "Nuuksio National Park, Espoo",
    startDate: "2025-06-29",
    durationDays: 1,
    title: "Guided Nature Walk",
  },
  {
    imageUrl: "https://picsum.photos/400/300",
    place: "Market Square, Helsinki",
    startDate: "2025-07-12",
    durationDays: 3,
    title: "Taste of Helsinki",
  },
  {
    imageUrl: "https://picsum.photos/400/300",
    place: "Finnish National Theatre, Helsinki",
    startDate: "2025-08-18",
    durationDays: 7,
    title: "The Seagull - A New Adaptation",
  },
  {
    imageUrl: "https://picsum.photos/400/300",
    place: "Messukeskus Helsinki, Expo and Convention Center",
    startDate: "2025-09-15",
    durationDays: 4,
    title: "Nordic Game Expo",
  },
  {
    imageUrl: "https://picsum.photos/400/300",
    place: "Old Market Hall, Helsinki",
    startDate: "2025-10-05",
    durationDays: 2,
    title: "Autumn Artisan Market",
  },
  {
    imageUrl: "https://picsum.photos/400/300",
    place: "Ursa Observatory, Helsinki",
    startDate: "2025-10-26",
    durationDays: 1,
    title: "Observing the Orion Nebula",
  },
  {
    imageUrl: "https://picsum.photos/400/300",
    place: "Coastal Road, Espoo",
    startDate: "2025-07-05",
    durationDays: 1,
    title: "Scenic Archipelago Bike Ride",
  },
  {
    imageUrl: "https://picsum.photos/400/300",
    place: "National Museum of Finland, Helsinki",
    startDate: "2025-06-22",
    durationDays: 1,
    title: "The Viking Age in Finland",
  },
];
