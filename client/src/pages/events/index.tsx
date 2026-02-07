import { EventsList, uniteFilter } from "@/features/events-list";
import { PageContainer } from "@/shared/ui/PageContainer";
import { SearchBar } from "@/shared/ui/SearchBar";

const SEARCH_PARAM_NAME = "search";

export const EventsListPage: React.FC = () => {
  return (
    <PageContainer name="Events">
      <div className="flex flex-col gap-4 pb-24">
        <SearchBar
          paramName={SEARCH_PARAM_NAME}
          placeholder="Search events by title, place, or creator..."
        />
        <EventsList
          filterFn={uniteFilter}
          searchParamName={SEARCH_PARAM_NAME}
        />
      </div>
    </PageContainer>
  );
};
