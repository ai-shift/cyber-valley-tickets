import { useAuthSlice } from "@/app/providers";
import { useLogin } from "@/features/login/hooks/useLogin";
import { getCurrencySymbol, hasEnoughtTokens } from "@/shared/lib/web3";
import { Button } from "@/shared/ui/button";
import { Loader } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useActiveAccount } from "thirdweb/react";

import type { User } from "@/entities/user";

export const useCheckSubmit = () => {
  const { user } = useAuthSlice();

  const account = useActiveAccount();
  const [canCreate, setCanCreate] = useState(false);
  const [requriedTokens, setRequiredTokens] = useState(BigInt(0));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (account == null) return;
    hasEnoughtTokens(account).then(({ enoughTokens, balanceAfterPayment }) => {
      console.log("Balance after payment", balanceAfterPayment);
      setCanCreate(enoughTokens);
      setRequiredTokens(balanceAfterPayment);
      setIsLoading(false);
    });
  }, [account]);

  const props: WithCheckProps = {
    user,
    canCreate,
    requriedTokens,
    isLoading,
  };

  return { WithSubmitCheck, props };
};

type WithCheckProps = {
  children?: React.ReactNode;
  user: User | null;
  canCreate: boolean;
  requriedTokens: bigint;
  isLoading: boolean;
};

const WithSubmitCheck: React.FC<WithCheckProps> = ({
  children,
  user,
  canCreate,
  requriedTokens,
  isLoading,
}) => {
  const navigate = useNavigate();
  const { LoginBtn, buttonProps } = useLogin();

  if (!user)
    return (
      <LoginBtn
        {...buttonProps}
        className="w-full"
        title="Login to create an event"
      />
    );

  return isLoading ? (
    <Loader />
  ) : user!.socials.length === 0 ? (
    <Button className="w-full" onClick={() => navigate("/socials")}>
      Set socials first
    </Button>
  ) : canCreate ? (
    <>{children}</>
  ) : (
    // TODO: Plase SwapWidget component here
    <Button
      type="button"
      className="w-full h-20 flex flex-col"
      onClick={() => alert("Suda swap widget")}
    >
      <span>Need more tokens</span>
      <p className="flex gap-1">
        <span>Need {requriedTokens}</span>
        <img
          src={getCurrencySymbol()}
          className="h-6 aspect-square inline"
          alt="currency"
        />
        <span>more to submit</span>
      </p>
    </Button>
  );
};
