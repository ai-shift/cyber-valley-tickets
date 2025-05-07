import { useRefreshSlice } from "@/app/providers";
import { cn } from "@/shared/lib/utils";
import { ErrorMessage } from "@/shared/ui/ErrorMessage";
import { Loader } from "@/shared/ui/Loader";
import { Button } from "@/shared/ui/button";
import { useMutation } from "@tanstack/react-query";
import { login } from "../api/login";

export const Login: React.FC = () => {
  const { setHasJWT } = useRefreshSlice();
  const { mutate, error, isPending } = useMutation({
    mutationFn: login,
    onSuccess: () => {
      setHasJWT(true);
    },
  });

  return (
    <div className="flex h-full justify-center items-center">
      <div className="text-center space-y-5">
        {isPending && <Loader className="h-60" />}
        <Button className={cn(isPending && "hidden")} onClick={() => mutate()}>
          Login
        </Button>
        {error && (
          <ErrorMessage
            className="capitalize text-destructive"
            errors={error}
          />
        )}
      </div>
    </div>
  );
};
