import { useNavigate } from "react-router";

import { useAuthSlice } from "@/app/providers";
import { EventsList, uniteFilter } from "@/features/events-list/";
import { NotificationIcon } from "@/features/notifications";
import { Button } from "@/shared/ui/button";

import { EbaliMap } from "@/features/map";

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthSlice();

  return (
    <div className="px-6">
      <h1 className="text-shadow-md text-shadow-primary text-primary text-5xl py-4">
        Cyber Valley
      </h1>
      <div className="w-full h-[1px] bg-primary/30" />
      <div className="flex justify-between items-center py-3">
        <p className="text-xl">Greetings, traveller!</p>
        {user && <NotificationIcon />}
      </div>
      <div className="w-full h-[1px] bg-primary/30" />
      <Button
        onClick={() => navigate("/events/create")}
        className="w-full text-center text-2xl mt-8 h-14 card"
      >
        Become SHAMAN
      </Button>
      <EbaliMap />
      <section className="mt-8">
        <EventsList filterFn={uniteFilter} />
      </section>
    </div>
  );
};
