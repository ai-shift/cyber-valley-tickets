import { PlaceEditor } from "@/features/create-edit-place";
import { PageContainer } from "@/shared/ui/PageContainer";

export const CreatePlacePage: React.FC = () => {
  return (
    <PageContainer name="Create event place">
      <PlaceEditor />
    </PageContainer>
  );
};
