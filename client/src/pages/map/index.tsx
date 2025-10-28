import { ApplyEventButton, HomeMap } from "@/features/home";

export const MapPage = () => {
  return (
    <div className="h-[calc(100dvh-4rem)] flex flex-col">
      <HomeMap className="flex-1 h-full" />
      <ApplyEventButton />
    </div>
  );
};
