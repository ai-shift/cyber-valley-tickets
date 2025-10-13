import { useAuthSlice } from "@/app/providers";
import { PageContainer } from "@/shared/ui/PageContainer";
import { Link } from "react-router";

export const ManagePage: React.FC = () => {
  const { user } = useAuthSlice();

  return (
    <PageContainer hasBackIcon={false} name="Manage">
      <div className="flex flex-col gap-7 px-5 py-9">
        {user?.role === "localprovider" && (
          <>
            <Link
              className="card border-primary/30 text-center text-xl py-5"
              to="/manage/place"
            >
              Manage places
            </Link>
            <Link
              className="card border-primary/30 text-center text-xl py-5"
              to="/manage/staff"
            >
              Manage staff
            </Link>
          </>
        )}
        {user?.role === "master" && (
            <Link
              className="card border-primary/30 text-center text-xl py-5"
              to="/manage/localproviders"
            >
              Manage local providers
            </Link>
        )}
      </div>
    </PageContainer>
  );
};
