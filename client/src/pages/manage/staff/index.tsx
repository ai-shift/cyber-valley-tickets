import { StaffForm } from "@/features/staff-form";
import { StaffList } from "@/features/staff-list";
import { PageContainer } from "@/shared/ui/PageContainer";

export const ManageStaffPage: React.FC = () => {
  return (
    <PageContainer name="Manage staff">
      <StaffForm />
      <StaffList />
    </PageContainer>
  );
};
