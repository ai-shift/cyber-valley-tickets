import { useAuthSlice } from "@/app/providers";
import type { User } from "@/entities/user";
import { PageContainer } from "@/shared/ui/PageContainer";
import { Link } from "react-router";

export const ManagePage: React.FC = () => {
  const { user } = useAuthSlice();

  if (!user) {
    return null;
  }

  return (
    <PageContainer hasBackIcon={false} name="Manage">
      <div className="flex flex-col gap-7 px-5 py-9">{manageView(user)}</div>
    </PageContainer>
  );
};

const manageView = (user: User): React.ReactNode => {
  switch (user.role) {
    case "master":
      return <MasterView />;
    case "localprovider":
      return <LocalProviderView />;
    case "verifiedshaman":
      return <VerifiedShamanView />;
    default:
      return null;
  }
};

const VerifiedShamanView = (): React.ReactNode => (
  <Link
    className="card border-primary/30 text-center text-xl py-5"
    to="/request-place"
  >
    Request event place
  </Link>
);

const LocalProviderView = (): React.ReactNode => (
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
    <Link
      className="card border-primary/30 text-center text-xl py-5"
      to="/manage/verifiedshamans"
    >
      Manage verified shamans
    </Link>
  </>
);

const MasterView = (): React.ReactNode => (
  <Link
    className="card border-primary/30 text-center text-xl py-5"
    to="/manage/localproviders"
  >
    Manage local providers
  </Link>
);
