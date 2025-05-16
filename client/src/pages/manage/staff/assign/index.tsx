import { StaffForm } from "@/features/staff-form";
import { PageContainer } from "@/shared/ui/PageContainer";

export const AssignStaffPage: React.FC = () => {
  return (
    <PageContainer name="Assign staff">
      <StaffForm />
    </PageContainer>
  );
};
