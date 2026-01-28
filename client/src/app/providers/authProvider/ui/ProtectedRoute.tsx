import { Outlet } from "react-router";
import { useAuthSlice } from "../model/authSlice";
import { useLogin } from "@/features/login/hooks/useLogin";

export const ProtectedRoute: React.FC = () => {
  const { hasJWT } = useAuthSlice();
  const {LoginBtn} = useLogin()

  if (hasJWT) {
    return <Outlet />;
  }
  return (
    <div className="h-full flex justify-center items-center px-6">
      <div>
        <h2 className="text-xl">
          You have to be logged in to access this resource.
        </h2>
        <div className="flex justify-center items-center mt-20">
          <LoginBtn />
        </div>
      </div>
    </div>
  );
};
