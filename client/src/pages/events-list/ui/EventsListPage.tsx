import { EventsList as BaseEventList, filter } from "@/features/events-list";
import { PageContainer } from "@/shared/ui/PageContainer";

export const EventsListPage: React.FC = () => {
  console.log("filter Fn", filter);
  return (
    <PageContainer name="Events">
      <BaseEventList filterFn={filter} />
    </PageContainer>
  );
};
