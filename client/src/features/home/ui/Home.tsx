import { EventsList, uniteFilter } from "@/features/events-list";
import { NotificationButton } from "@/features/notifications";
import { Button } from "@/shared/ui/button";
import { useNavigate } from "react-router";
import { ApplyEventButton } from "./ApplyEventButton";
import { HomeMap } from "./HomeMap";

export const Home = () => {
  const navigate = useNavigate();
  return (
    <div>
      <div className="px-6">
        <h1 className="text-shadow-md text-shadow-primary text-primary text-5xl py-4">
          Cyber Valley
        </h1>
        <div className="flex justify-between items-center py-3 border-b-[1px] border-t-[1px] border-primary/20">
          <p className="text-xl">Greetings, traveller!</p>
          <NotificationButton />
        </div>
      </div>
      <div className="flex sticky top-1 z-100 justify-baseline p-5">
        <Button
          onClick={() => navigate("/events/create")}
          className="w-full text-center text-2xl h-14 card"
        >
          Become SHAMAN
        </Button>
      </div>
      <HomeMap />
      <section className="mt-8">
        <EventsList filterFn={uniteFilter} />
      </section>
      <ApplyEventButton />
    </div>
  );
};
