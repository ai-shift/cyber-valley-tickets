import { PageContainer } from "@/shared/ui/PageContainer";
import { BaseEventList } from "@/features/BaseEventsList/ui/BaseEventList";

import { events } from "../mock";

export const EventsList: React.FC = () => {
  return (
    <PageContainer name="Events">
      <BaseEventList events={events} />
    </PageContainer>
  );
};
