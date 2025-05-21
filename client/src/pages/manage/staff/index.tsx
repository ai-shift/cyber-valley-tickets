import { StaffForm } from "@/features/staff-form";
import { StaffList } from "@/features/staff-list";
import { PageContainer } from "@/shared/ui/PageContainer";

export const ManageStaffPage: React.FC = () => {
  return (
    <PageContainer name="Manage staff">
      <section className=" px-5 py-9">
        <StaffForm />
        <StaffList />
      </section>
    </PageContainer>
  );
};
