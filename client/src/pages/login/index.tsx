import { useRefreshSlice } from "@/app/providers";
import { Login } from "@/features/login";
import { Navigate } from "react-router";

export const LoginPage: React.FC = () => {
  const { hasJWT } = useRefreshSlice();
  return !hasJWT ? <Login /> : <Navigate to="/" />;
};
