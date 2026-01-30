import { useLogin } from "@/features/login/hooks/useLogin";
import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";
import { useAuthSlice } from "../model/authSlice";

export const ProtectedRoute: React.FC = () => {
  const { hasJWT } = useAuthSlice();
  const { login } = useLogin();
  const navigate = useNavigate();

  useEffect(() => {
    if (!hasJWT) {
      login()
        .then((data) => {
          console.log("LOGIN DATA", data);
        })
        .catch((error) => {
          console.log("LOGIN ERROR +++++++++++++++++++++++", error);
          return navigate("/");
        });
    }
  }, [hasJWT, login]);

  if (!hasJWT) {
    return null;
  } else {
    return <Outlet />;
  }
};
