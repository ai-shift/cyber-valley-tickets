import { EventsList, myEventsFilter } from "@/features/events-list";
import { PageContainer } from "@/shared/ui/PageContainer";

export const MyEventsPage: React.FC = () => {
  return (
    <PageContainer name="My events">
      <EventsList filterFn={myEventsFilter} />
    </PageContainer>
  );
};
