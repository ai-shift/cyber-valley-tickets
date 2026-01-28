import { useAuthSlice } from "@/app/providers/authProvider";
import { PlaceEditor } from "@/features/create-edit-place";
import { RequestEventPlace } from "@/features/request-place";
import { checkPermission } from "@/shared/lib/RBAC";
import { PageContainer } from "@/shared/ui/PageContainer";

export const CreatePlaceUnifiedPage: React.FC = () => {
  const { user } = useAuthSlice();
  const canCreatePlace = checkPermission(user?.role, "place:create");

  return (
    <PageContainer
      name={canCreatePlace ? "Create event place" : "Request event place"}
    >
      {canCreatePlace ? <PlaceEditor /> : <RequestEventPlace />}
    </PageContainer>
  );
};
