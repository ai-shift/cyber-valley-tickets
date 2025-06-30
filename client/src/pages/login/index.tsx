import { useAuthSlice } from "@/app/providers";
import { Login } from "@/features/login";
import { Navigate } from "react-router";

export const LoginPage: React.FC = () => {
  const { hasJWT } = useAuthSlice();
  return !hasJWT ? <Login /> : <Navigate to="/" />;
};
