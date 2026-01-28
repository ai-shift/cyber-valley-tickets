import { useAuthSlice } from "@/app/providers";
import type { User } from "@/entities/user";
import { useLogin } from "@/features/login";
import { checkPermission } from "@/shared/lib/RBAC";
import { Button } from "@/shared/ui/button";
import { useNavigate } from "react-router";

export const useCheckSubmit = () => {
  const { user } = useAuthSlice();
  const canCreatePlace = checkPermission(user?.role, "place:create");

  const props: WithCheckProps = {
    user,
    canCreatePlace,
  };

  return { WithSubmitCheck, props };
};

type WithCheckProps = {
  children?: React.ReactNode;
  user: User | null;
  canCreatePlace: boolean;
};

const WithSubmitCheck: React.FC<WithCheckProps> = ({
  children,
  user,
  canCreatePlace,
}) => {
  const { LoginBtn, buttonProps } = useLogin();
  const navigate = useNavigate();

  if (!user)
    return (
      <LoginBtn
        {...buttonProps}
        className="w-full"
        title="Login to create a place"
      />
    );

  return canCreatePlace ? (
    <>{children}</>
  ) : (
    <Button
      className="w-full"
      type="button"
      onClick={() => navigate("/verify")}
    >
      Verify to create a place
    </Button>
  );
};
