import { Nav } from "@/shared/widgets/navigation";

import { BaseEventList } from "@/widgets/BaseEventsList/ui/BaseEventList";

import { events } from "../mock";

export const Home = () => {
  return (
    <div>
      <Nav />
      Home
      <BaseEventList events={events} limit={3} />
    </div>
  );
};
