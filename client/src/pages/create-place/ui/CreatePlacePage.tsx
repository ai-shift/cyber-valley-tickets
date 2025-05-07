import { CreatePlace } from "@/features/create-place";
import { PageContainer } from "@/shared/ui/PageContainer";

export const CreatePlacePage: React.FC = () => {
  return (
    <PageContainer name="Create place">
      <CreatePlace />
    </PageContainer>
  );
};
