import { ApplyEventButton, HomeMap } from "@/features/home";

export const MapPage = () => {
  return (
    <div className="h-full flex-1 flex-col relative overflow-y-hidden">
      <HomeMap />
      <ApplyEventButton />
    </div>
  );
};
