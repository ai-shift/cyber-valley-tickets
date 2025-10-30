import { Button } from "@/shared/ui/button";
import { Outlet, useNavigate } from "react-router";
import { useAuthSlice } from "../model/authSlice";

export const ProtectedRoute: React.FC = () => {
  const { hasJWT } = useAuthSlice();
  const navigate = useNavigate();

  if (hasJWT) {
    return <Outlet />;
  }
  return (
    <div className="h-full flex justify-center items-center px-6">
      <div>
        <h2 className="text-xl">
          You have to be logged in to access this resource.
        </h2>
        <div className="flex justify-between items-center mt-20">
          <Button
            onClick={() =>
              navigate("/login", {
                state: {
                  goBack: true,
                },
              })
            }
          >
            Login
          </Button>
        </div>
      </div>
    </div>
  );
};
