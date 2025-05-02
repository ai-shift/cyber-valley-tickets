// FIXME: Do not import from feature contents directly
import { PlaceForm } from "@/features/place-form/ui/PlaceForm";
import { PageContainer } from "@/shared/ui/PageContainer";

export const ManagePage: React.FC = () => {
  return (
    <PageContainer name="Manage">
      <PlaceForm />
    </PageContainer>
  );
};
