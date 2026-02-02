import { useAuthSlice } from "@/app/providers";
import type { User } from "@/entities/user";
import { getPrimaryRole, hasRole } from "@/shared/lib/RBAC";
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
  // Show Master view if user has master role (highest priority)
  if (hasRole(user.roles, "master")) {
    return <MasterView />;
  }

  // Otherwise use primary role to determine view
  const primaryRole = getPrimaryRole(user.roles);

  switch (primaryRole) {
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
