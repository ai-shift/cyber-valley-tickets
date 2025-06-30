import { Button } from "@/shared/ui/button";
import { Outlet, useNavigate } from "react-router";
import { useRefreshSlice } from "../model/refreshSlice";

export const ProtectedRoute: React.FC = () => {
  const { hasJWT } = useRefreshSlice();
  const navigate = useNavigate();

  if (hasJWT) {
    return <Outlet />;
  }
  return (
    <div>
      <h2>You have to be logged in to access this resource.</h2>
      <div className="flex justify-between items-center">
        <Button
          variant="secondary"
          filling="outline"
          onClick={() => navigate(-1)}
        >
          Go back
        </Button>
        <Button onClick={() => navigate("/login")}>Login</Button>
      </div>
    </div>
  );
};
