import { useAuth } from "@/app/providers/authProvider/hooks/useAuth";
import { useRefreshSlice } from "@/app/providers/refreshSlice";
import { Navigate } from "react-router";

export const LoginPage: React.FC = () => {
  const { hasJWT } = useRefreshSlice();

  if (!hasJWT) return <div>Login</div>;

  const { isAuth } = useAuth();

  if (isAuth) return <Navigate to="/" />;

  return <div>Login</div>;
};
