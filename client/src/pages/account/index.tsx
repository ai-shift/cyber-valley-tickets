import { useAuthSlice } from "@/app/providers";
import { EventsList, myEventsFilter } from "@/features/events-list";
import { apiClient } from "@/shared/api";
import { useTokenBalance } from "@/shared/hooks";
import { formatAddress } from "@/shared/lib/formatAddress";
import { getCurrencySymbol, mintERC20 } from "@/shared/lib/web3";
import { Loader } from "@/shared/ui/Loader";
import { BridgeWidget } from "@/shared/ui/bridge/BridgeWidget";
import { Button } from "@/shared/ui/button";
import { Expandable } from "@/shared/ui/expandable/ui/Expandable";
import { ExpandableContent } from "@/shared/ui/expandable/ui/ExpandableContent";
import { ExpandableTrigger } from "@/shared/ui/expandable/ui/ExpandableTrigger";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { useActiveAccount } from "thirdweb/react";

export const AccountPage: React.FC = () => {
  const { logout: signOut } = useAuthSlice();
  const account = useActiveAccount();
  const { data: tokenBalance, isLoading: isLoadingBalance } = useTokenBalance();
  const queryClient = useQueryClient();
  const [isMinting, setIsMinting] = useState(false);

  const logout = async () => {
    if (!confirm("Logout?")) {
      return;
    }
    await apiClient.GET("/api/auth/logout");
    signOut();
  };

  if (!account) return <Loader />;
  const address = account.address;

  return (
    <div>
      <header className="flex justify-start items-center gap-5 py-4 px-5">
        <h2 className="text-2xl font-semibold text-primary text-shadow-primary text-shadow-xs">
          Account
        </h2>
        <Button className="ml-auto" variant="destructive" onClick={logout}>
          <LogOut />
        </Button>
      </header>
      <div className="flex flex-col">
        <div className="flex gap-5 self-center py-5 px-10 sm:px-20">
          <div className="flex md:flex-row md:gap-3 flex-col items-center">
            <img
              className="rounded-full h-14 md:h-20 aspect-square"
              src={`https://effigy.im/a/${address}.svg`}
              alt="User"
            />
            <div className="flex flex-col items-center md:items-start gap-1">
              <p className="text-lg">
                {formatAddress(address as `0x${string}`)}
              </p>
              <div className="flex items-center gap-2">
                <img
                  className="h-6 aspect-square"
                  src={getCurrencySymbol()}
                  alt="Token"
                />
                <p className="text-lg font-semibold text-gray-400">
                  {isLoadingBalance
                    ? "Loading..."
                    : tokenBalance
                      ? tokenBalance.toString()
                      : "0"}{" "}
                  tokens
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="w-1/2 h-full self-center flex flex-col justify-between gap-20">
          <div className="flex flex-col gap-4">
            <Button
              className="mt-8"
              disabled={isMinting}
              onClick={async () => {
                const maybeAmount = prompt("Amount of tokens to mint:");
                if (maybeAmount == null) {
                  // User decided to cancel
                  return;
                }

                let amount: bigint;
                try {
                  amount = BigInt(maybeAmount);
                } catch (e) {
                  alert(`Failed to process amount with: ${JSON.stringify(e)}`);
                  return;
                }

                if (amount <= 0) {
                  alert("Amount should be greater than zero");
                  return;
                }

                setIsMinting(true);
                try {
                  await mintERC20(account, amount);
                  alert(`Minted ${amount} tokens`);
                  // Invalidate and refetch the token balance
                  queryClient.invalidateQueries({
                    queryKey: ["tokenBalance", account?.address],
                  });
                } catch (err) {
                  alert(`Failed to mint ERC20 with ${JSON.stringify(err)}`);
                } finally {
                  setIsMinting(false);
                }
              }}
            >
              {isMinting ? "Minting..." : "Mint ERC20"}
            </Button>
            <BridgeWidget />
          </div>
        </div>
        <div className="p-5">
          <Expandable defaultOpened>
            <ExpandableTrigger className="w-full my-3 p-3 text-xl flex justify-start gap-3 items-center">
              {({ isCurrentExpanded }) => (
                <>
                  <img
                    className={twMerge(
                      "h-8 transition-all duration-300",
                      isCurrentExpanded && "rotate-90",
                    )}
                    alt="chevrone"
                    src="/icons/chevrone_right.svg"
                  />
                  <span>Current events</span>
                </>
              )}
            </ExpandableTrigger>
            <ExpandableContent>
              <EventsList
                filterFn={(event, user) =>
                  myEventsFilter(event, user, "current")
                }
              />
            </ExpandableContent>
          </Expandable>
          <Expandable defaultOpened>
            <ExpandableTrigger className="w-full my-3 p-3 text-xl flex justify-start gap-3 items-center">
              {({ isCurrentExpanded }) => (
                <>
                  <img
                    className={twMerge(
                      "h-8 transition-all duration-300",
                      isCurrentExpanded && "rotate-90",
                    )}
                    alt="chevrone"
                    src="/icons/chevrone_right.svg"
                  />
                  <span>Upcoming events</span>
                </>
              )}
            </ExpandableTrigger>
            <ExpandableContent>
              <EventsList
                filterFn={(event, user) =>
                  myEventsFilter(event, user, "upcoming")
                }
              />
            </ExpandableContent>
          </Expandable>
          <Expandable defaultOpened>
            <ExpandableTrigger className="w-full my-3 p-3 text-xl flex justify-start gap-3 items-center">
              {({ isCurrentExpanded }) => (
                <>
                  <img
                    className={twMerge(
                      "h-8 transition-all duration-300",
                      isCurrentExpanded && "rotate-90",
                    )}
                    alt="chevrone"
                    src="/icons/chevrone_right.svg"
                  />
                  <span>Past events</span>
                </>
              )}
            </ExpandableTrigger>
            <ExpandableContent>
              <EventsList
                filterFn={(event, user) => myEventsFilter(event, user, "past")}
              />
            </ExpandableContent>
          </Expandable>
        </div>
      </div>
    </div>
  );
};
