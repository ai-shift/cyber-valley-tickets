import { PlaceForm } from "@/features/place-form";
import { PageContainer } from "@/shared/ui/PageContainer";

export const CreatePlacePage: React.FC = () => {
  return (
    <PageContainer name="Create place">
      <PlaceForm />
    </PageContainer>
  );
};
