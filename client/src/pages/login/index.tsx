import { useAuthSlice } from "@/app/providers";
import { Login } from "@/features/login";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";

export const LoginPage: React.FC = () => {
  const { hasJWT } = useAuthSlice();
  const { state } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!hasJWT) return;
    if (state?.goBack) {
      navigate(-1);
    } else {
      navigate("/");
    }
  }, [hasJWT, state, navigate]);

  return !hasJWT && <Login />;
};
