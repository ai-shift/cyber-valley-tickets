import { EventsList, uniteFilter } from "@/features/events-list";
import { PageContainer } from "@/shared/ui/PageContainer";

export const EventsListPage: React.FC = () => {
  return (
    <PageContainer name="Events">
      <EventsList filterFn={uniteFilter} />
    </PageContainer>
  );
};
