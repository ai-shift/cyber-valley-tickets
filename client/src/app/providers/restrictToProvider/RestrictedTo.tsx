import { type View, checkView } from "@/shared/lib/RBAC";
import { Navigate, Outlet } from "react-router";
import { useAuthSlice } from "../authProvider";

type RestrictedToProps = {
  view: View;
};

export const RestrictedTo: React.FC<RestrictedToProps> = ({ view }) => {
  const { user } = useAuthSlice();

  if (!user) {
    return <Navigate to="/account" />;
  }

  if (!checkView(user.role, view)) {
    return <Navigate to="/" />;
  }

  return <Outlet />;
};
