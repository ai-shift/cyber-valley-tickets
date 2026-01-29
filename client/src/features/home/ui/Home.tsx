import { EventsList, uniteFilter } from "@/features/events-list";
import { SearchBar } from "@/shared/ui/SearchBar";

const SEARCH_PARAM_NAME = "search";

export const Home = () => {
  return (
    <div>
      <div className="px-6">
        <h1 className="text-shadow-md text-shadow-primary text-primary text-5xl py-4">
          Events
        </h1>
      </div>
      <section className="mt-8">
        <div className="flex flex-col gap-4">
          <SearchBar
            paramName={SEARCH_PARAM_NAME}
            placeholder="Search events by title, place, or creator..."
          />
          <EventsList
            filterFn={uniteFilter}
            searchParamName={SEARCH_PARAM_NAME}
          />
        </div>
      </section>
    </div>
  );
};
