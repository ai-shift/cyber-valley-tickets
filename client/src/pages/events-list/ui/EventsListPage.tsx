import { EventsList as BaseEventList } from "@/features/events-list";
import { PageContainer } from "@/shared/ui/PageContainer";

export const EventsListPage: React.FC = () => {
  return (
    <PageContainer name="Events">
      <BaseEventList />
    </PageContainer>
  );
};
