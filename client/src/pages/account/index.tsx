import { useAuthSlice } from "@/app/providers";
import type { User } from "@/entities/user";
import { EventsList, myEventsFilter } from "@/features/events-list";
import { apiClient } from "@/shared/api";
import { useTokenBalance } from "@/shared/hooks";
import { getCurrencySymbol, mintERC20 } from "@/shared/lib/web3";
import { AddressDisplay } from "@/shared/ui/AddressDisplay";
import { BridgeWidget } from "@/shared/ui/bridge/BridgeWidget";
import { Button } from "@/shared/ui/button";
import { Expandable } from "@/shared/ui/expandable/ui/Expandable";
import { ExpandableContent } from "@/shared/ui/expandable/ui/ExpandableContent";
import { ExpandableTrigger } from "@/shared/ui/expandable/ui/ExpandableTrigger";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { twMerge } from "tailwind-merge";
import { useActiveAccount } from "thirdweb/react";

const getRoleDisplayName = (user: User | null): string | null => {
  if (!user) return null;

  switch (user.role) {
    case "master":
      return "Master";
    case "localprovider":
      return "LocalProvider";
    case "verifiedshaman":
      return "VerifiedShaman";
    case "creator":
      return "Shaman";
    default:
      return null;
  }
};

export const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout: signOut, user } = useAuthSlice();
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

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <h2 className="text-2xl font-semibold text-primary">Account</h2>
        <p className="text-lg text-gray-400">
          Please login to view your account
        </p>
        <Button onClick={() => navigate("/login")}>Login</Button>
      </div>
    );
  }

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
                <AddressDisplay address={address} socials={user?.socials} />
              </p>
              {getRoleDisplayName(user) && (
                <p className="text-sm font-semibold text-primary">
                  {getRoleDisplayName(user)}
                </p>
              )}
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
            {(() => {
              const lastSocial =
                user?.socials && user.socials.length > 0
                  ? user.socials[user.socials.length - 1]
                  : null;
              return (
                lastSocial && (
                  <div className="flex items-center justify-between">
                    <h3 className="capitalize font-semibold text-lg">
                      {lastSocial.network}:
                    </h3>
                    <p className="italic">{lastSocial.value}</p>
                  </div>
                )
              );
            })()}
            <Button
              filling="outline"
              type="button"
              onClick={() => navigate("/socials")}
            >
              {user?.socials[0] ? "Update" : "Set"} socials
            </Button>
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
        {user && manageView(user)}
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

const manageView = (user: User): React.ReactNode => {
  switch (user.role) {
    case "master":
      return <MasterView />;
    case "localprovider":
      return <LocalProviderView />;
    case "verifiedshaman":
      return <VerifiedShamanView />;
    default:
      return null;
  }
};

const VerifiedShamanView = (): React.ReactNode => (
  <div className="p-5">
    <h3 className="text-xl font-semibold text-primary mb-4">Management</h3>
    <Link
      className="card border-primary/30 text-center text-xl py-5"
      to="/request-place"
    >
      Request event place
    </Link>
  </div>
);

const LocalProviderView = (): React.ReactNode => (
  <div className="p-5">
    <h3 className="text-xl font-semibold text-primary mb-4">Management</h3>
    <div className="flex flex-col gap-7">
      <Link
        className="card border-primary/30 text-center text-xl py-5"
        to="/manage/place"
      >
        Manage places
      </Link>
      <Link
        className="card border-primary/30 text-center text-xl py-5"
        to="/manage/staff"
      >
        Manage staff
      </Link>
      <Link
        className="card border-primary/30 text-center text-xl py-5"
        to="/manage/verifiedshamans"
      >
        Manage verified shamans
      </Link>
    </div>
  </div>
);

const MasterView = (): React.ReactNode => (
  <div className="p-5">
    <h3 className="text-xl font-semibold text-primary mb-4">Management</h3>
    <div className="flex flex-col gap-7">
      <Link
        className="card border-primary/30 text-center text-xl py-5"
        to="/manage/localproviders"
      >
        Manage local providers
      </Link>
      <Link
        className="card border-primary/30 text-center text-xl py-5"
        to="/manage/place"
      >
        Manage places
      </Link>
      <Link
        className="card border-primary/30 text-center text-xl py-5"
        to="/manage/staff"
      >
        Manage staff
      </Link>
      <Link
        className="card border-primary/30 text-center text-xl py-5"
        to="/manage/verifiedshamans"
      >
        Manage verified shamans
      </Link>
    </div>
  </div>
);
