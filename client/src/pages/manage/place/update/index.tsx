import type { EventPlace } from "@/entities/place";
import { PlaceEditor } from "@/features/create-edit-place";
import { PageContainer } from "@/shared/ui/PageContainer";
import { useLocation, type Location, Navigate } from "react-router";

export const UpdatePlacePage: React.FC = () => {
  const { state: place }: Location<EventPlace | undefined> = useLocation();

  if (!place?.id) return <Navigate to="/manage/places" />;

  return (
    <PageContainer name="Update event place">
      <PlaceEditor placeForEdit={place} />
    </PageContainer>
  );
};
