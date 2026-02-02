import { HomeMap } from "@/features/home";
import { useShowFormNav } from "@/shared/widgets/navigation/hooks/useShowFormNav";

export const MapPage = () => {
  useShowFormNav();
  return (
    <div className="h-full flex-1 flex-col relative overflow-hidden">
      <HomeMap />
    </div>
  );
};
