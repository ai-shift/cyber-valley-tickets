import { useAuthSlice } from "@/app/providers";
import { useLogin } from "../hooks/useLogin";

export const Login: React.FC = () => {
  const { user } = useAuthSlice();
  const { LoginBtn, buttonProps } = useLogin();

  return (
    <div className="h-screen flex flex-col items-center justify-center gap-3">
      <p>Login to access the resource</p>
      {!user && <LoginBtn {...buttonProps} />}
    </div>
  );
};
