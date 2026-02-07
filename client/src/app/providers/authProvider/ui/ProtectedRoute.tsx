import { Outlet, Navigate } from "react-router";
import { useActiveAccount } from "thirdweb/react";
import { useAuthSlice } from "../model/authSlice";

export const ProtectedRoute: React.FC = () => {
  const { status } = useAuthSlice();
  const account = useActiveAccount();

  if (status === "boot") return null;
  if (!account || status !== "connected") {
    return <Navigate to="/account" state={{ goBack: true }} replace />;
  }

  return <Outlet />;
};
