import { Nav } from "@/shared/widgets/navigation";

import { Link } from "react-router";

import { EventsList } from "@/features/events-list/";

export const HomePage: React.FC = () => {
  return (
    <div>
      <Nav />
      <div className="w-full h-2 bg-amber-700" />
      <div className="flex justify-between items-center p-3">
        <p>You have 6 unread notifications</p>
        <Link to="/notifications">See all...</Link>
      </div>
      <div className="w-full h-2 bg-amber-700" />
      <section>
        <div className="flex justify-between items-center p-3">
          <p>Upcoming events</p>
          <Link to="/events">See more...</Link>
        </div>
        <EventsList limit={3} />
      </section>
    </div>
  );
};
