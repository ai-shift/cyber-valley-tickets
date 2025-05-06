import { Link } from "react-router";

import { EventsList, upcomingFilter } from "@/features/events-list/";
import { NotificationIcon } from "@/features/notifications";

export const HomePage: React.FC = () => {
  return (
    <div>
      <div className="w-full h-2 bg-amber-700" />
      <div className="flex justify-between items-center p-3">
        <p> </p>
        <NotificationIcon />
      </div>
      <div className="w-full h-2 bg-amber-700" />
      <section>
        <div className="flex justify-between items-center p-3">
          <h2 className="text-base text-primary">Upcoming events</h2>
          <Link className="uppercase text-secondary" to="/events">
            See all
          </Link>
        </div>
        <EventsList isGrid limit={3} filterFn={upcomingFilter} />
      </section>
    </div>
  );
};
