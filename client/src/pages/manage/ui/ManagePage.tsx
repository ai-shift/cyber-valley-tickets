import { PageContainer } from "@/shared/ui/PageContainer";
import { Link } from "react-router";

export const ManagePage: React.FC = () => {
  return (
    <PageContainer name="Manage">
      <div className="flex flex-col p-16 gap-10">
        <Link to="/manage/create-place">Create new place</Link>
        <Link to="/manage/assign-staff">Assign new staff</Link>
      </div>
    </PageContainer>
  );
};
