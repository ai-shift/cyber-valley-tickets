import { PageContainer } from "@/shared/ui/PageContainer";
import { Link } from "react-router";

export const ManagePage: React.FC = () => {
  return (
    <PageContainer hasBackIcon={false} name="Manage">
      <div className="flex flex-col gap-7 px-5 py-9">
        <Link
          className="card border-primary/30 text-center text-xl py-5"
          to="/manage/create-place"
        >
          Create new place
        </Link>
        <Link
          className="card border-primary/30 text-center text-xl py-5"
          to="/manage/assign-staff"
        >
          Assign new staff
        </Link>
      </div>
    </PageContainer>
  );
};
