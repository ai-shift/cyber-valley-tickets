import { StaffForm } from "@/features/staff-form";
import { PageContainer } from "@/shared/ui/PageContainer";

export const AssignStaffPage: React.FC = () => {
  function onSubmit(address: string) {
    console.log(address);
  }

  return (
    <PageContainer name="Assign staff">
      <StaffForm onSubmit={onSubmit} />
    </PageContainer>
  );
};
