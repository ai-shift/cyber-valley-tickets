import { PlaceForm } from "@/features/place-form/ui/PlaceForm";
import { PageContainer } from "@/shared/ui/PageContainer";

export const Manage: React.FC = () => {
  return (
    <PageContainer name="Manage">
      <PlaceForm />
    </PageContainer>
  );
};
