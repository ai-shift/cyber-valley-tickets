import { ApplyEventButton, HomeMap } from "@/features/home";

export const MapPage = () => {
  return (
    <div className="h-full flex flex-col relative">
      <HomeMap className="flex-1 h-full" />
      <ApplyEventButton />
    </div>
  );
};
