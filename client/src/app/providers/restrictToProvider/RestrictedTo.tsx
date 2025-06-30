import type { Role } from "@/shared/lib/RBAC";
import { Navigate, Outlet } from "react-router";
import { useAuthSlice } from "../authProvider";

type RestrictedToProps = {
  userRole: Role;
};

export const RestrictedTo: React.FC<RestrictedToProps> = ({ userRole }) => {
  const { user } = useAuthSlice();

  return userRole === user?.role ? <Outlet /> : <Navigate to="/" />;
};
