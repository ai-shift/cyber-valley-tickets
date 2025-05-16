import { useUser } from "@/entities/user";
import type { Role } from "@/shared/lib/RBAC";
import { Navigate, Outlet } from "react-router";

type RestrictedToProps = {
  userRole: Role;
};

export const RestrictedTo: React.FC<RestrictedToProps> = ({ userRole }) => {
  const { user, isLoading } = useUser();

  return userRole === user?.role && !isLoading ? (
    <Outlet />
  ) : (
    <Navigate to="/" />
  );
};
