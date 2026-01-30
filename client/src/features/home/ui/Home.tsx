import { eventQueries } from "@/entities/event";
import { EventsList, uniteFilter } from "@/features/events-list";
import { SearchBar } from "@/shared/ui/SearchBar";
import { useQuery } from "@tanstack/react-query";

const SEARCH_PARAM_NAME = "search";

const formatRevenue = (amount: number | undefined) => {
  if (amount === undefined) return "0.00";
  return (amount / 1_000_000).toFixed(2);
};

export const Home = () => {
  const { data: revenue } = useQuery(eventQueries.totalRevenue());

  return (
    <div>
      <div className="px-6 flex justify-between items-center">
        <h1 className="text-shadow-md text-shadow-primary text-primary text-5xl py-4">
          Events
        </h1>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="text-xl font-bold text-primary">
            {formatRevenue(revenue?.total_revenue)} USDT
          </p>
        </div>
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
