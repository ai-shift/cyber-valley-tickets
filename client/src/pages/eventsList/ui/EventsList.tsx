import { PageContainer } from "@/shared/ui/PageContainer";
import { EventsList as BaseEventList } from "@/features/EventsList/ui/EventsList";

export const EventsList: React.FC = () => {
  return (
    <PageContainer name="Events">
      <BaseEventList limit={3} />
    </PageContainer>
  );
};
