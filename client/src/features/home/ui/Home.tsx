import { EventsList, uniteFilter } from "@/features/events-list";

export const Home = () => {
  return (
    <div>
      <div className="px-6">
        <h1 className="text-shadow-md text-shadow-primary text-primary text-5xl py-4">
          Events
        </h1>
      </div>
      <section className="mt-8">
        <EventsList filterFn={uniteFilter} />
      </section>
    </div>
  );
};
