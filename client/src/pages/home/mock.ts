import type { EventModel } from "@/entities/event/";

type EventMock = Pick<
  EventModel,
  "imageUrl" | "place" | "startDate" | "durationDays" | "title"
>;

export const events: EventMock[] = [
  {
    imageUrl: "https://picsum.photos/400/300",
    place: { title: "Amos Rex Museum, Helsinki" },
    startDate: 1753788635123,
    durationDays: 10,
    title: "Modern Art Retrospective",
  },
  {
    imageUrl: "https://picsum.photos/400/300",
    place: { title: "Helsinki Archipelago" },
    startDate: 1753788635123,
    durationDays: 2,
    title: "Annual Baltic Sea Race",
  },
  {
    imageUrl: "https://picsum.photos/400/300",
    place: "Nuuksio National Park, Espoo",
    startDate: 1753788635123,
    durationDays: 1,
    title: "Guided Nature Walk",
  },
  {
    imageUrl: "https://picsum.photos/400/300",
    place: "Market Square, Helsinki",
    startDate: 1753788635123,
    durationDays: 3,
    title: "Taste of Helsinki",
  },
  {
    imageUrl: "https://picsum.photos/400/300",
    place: "Finnish National Theatre, Helsinki",
    startDate: 1753788635123,
    durationDays: 7,
    title: "The Seagull - A New Adaptation",
  },
  {
    imageUrl: "https://picsum.photos/400/300",
    place: "Messukeskus Helsinki, Expo and Convention Center",
    startDate: 1753788635123,
    durationDays: 4,
    title: "Nordic Game Expo",
  },
  {
    imageUrl: "https://picsum.photos/400/300",
    place: "Old Market Hall, Helsinki",
    startDate: 1753788635123,
    durationDays: 2,
    title: "Autumn Artisan Market",
  },
  {
    imageUrl: "https://picsum.photos/400/300",
    place: "Ursa Observatory, Helsinki",
    startDate: 1753788635123,
    durationDays: 1,
    title: "Observing the Orion Nebula",
  },
  {
    imageUrl: "https://picsum.photos/400/300",
    place: "Coastal Road, Espoo",
    startDate: 1753788635123,
    durationDays: 1,
    title: "Scenic Archipelago Bike Ride",
  },
  {
    imageUrl: "https://picsum.photos/400/300",
    place: "National Museum of Finland, Helsinki",
    startDate: 1753788635123,
    durationDays: 1,
    title: "The Viking Age in Finland",
  },
];
