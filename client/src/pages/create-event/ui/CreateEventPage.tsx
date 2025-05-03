import { CreateEvent } from "@/features/create-event";
import { PageContainer } from "@/shared/ui/PageContainer";

export const CreateEventPage: React.FC = () => {
  return (
    <PageContainer name="Create event">
      <CreateEvent />
    </PageContainer>
  );
};
