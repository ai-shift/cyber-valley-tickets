import { PageContainer } from "@/shared/ui/PageContainer";
import { EventsList as BaseEventList } from "@/features/events-list/ui/EventsList";

export const EventsList: React.FC = () => {
  return (
    <PageContainer name="Events">
      <BaseEventList limit={3} />
    </PageContainer>
  );
};
