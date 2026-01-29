import { EventsList, uniteFilter } from "@/features/events-list";
import { PageContainer } from "@/shared/ui/PageContainer";
import { SearchBar } from "@/shared/ui/SearchBar";
import { useSearchParams } from "react-router";

export const EventsListPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || undefined;

  return (
    <PageContainer name="Events">
      <div className="flex flex-col gap-4">
        <SearchBar placeholder="Search events by title, place, or creator..." />
        <EventsList filterFn={uniteFilter} searchQuery={searchQuery} />
      </div>
    </PageContainer>
  );
};
