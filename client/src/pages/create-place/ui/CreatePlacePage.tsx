import { PlaceForm } from "@/features/place-form";
import type { EventPlaceForm } from "@/features/place-form";
import { PageContainer } from "@/shared/ui/PageContainer";

export const CreatePlacePage: React.FC = () => {
  // TODO: @scipunch inline handler & add Web3 bind
  function submitHandler(values: EventPlaceForm) {
    console.log(values);
  }

  return (
    <PageContainer name="Create place">
      <PlaceForm onSubmit={submitHandler} />
    </PageContainer>
  );
};
