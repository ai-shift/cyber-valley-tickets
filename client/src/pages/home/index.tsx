import { useNavigate } from "react-router";

import { EventsList, uniteFilter } from "@/features/events-list/";
import { NotificationIcon } from "@/features/notifications";
import { Button } from "@/shared/ui/button";

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="px-6">
      <h1 className="text-shadow-md text-shadow-primary text-primary text-5xl py-4">
        Cyber Valley
      </h1>
      <div className="w-full h-[1px] bg-primary/30" />
      <div className="flex justify-between items-center py-3">
        <p className="text-xl">Greetings, traveller!</p>
        <NotificationIcon />
      </div>
      <div className="w-full h-[1px] bg-primary/30" />
      <Button
        onClick={() => navigate("/events/create")}
        className="w-full text-center text-2xl mt-8 h-24 card"
      >
        Become SHAMAN
      </Button>
      <section className="mt-8">
        <EventsList filterFn={uniteFilter} />
      </section>
    </div>
  );
};
