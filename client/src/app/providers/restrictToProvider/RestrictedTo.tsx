import type { Role } from "@/shared/lib/RBAC";
import { Navigate, Outlet } from "react-router";
import { useAuthSlice } from "../authProvider";

type RestrictedToProps = {
  userRoles: Role[];
};

export const RestrictedTo: React.FC<RestrictedToProps> = ({ userRoles }) => {
  const { user } = useAuthSlice();

  return userRoles.includes(user?.role) ? <Outlet /> : <Navigate to="/" />;
};
