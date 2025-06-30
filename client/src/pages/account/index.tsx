import { useAuthSlice } from "@/app/providers";
import { EventsList, myEventsFilter } from "@/features/events-list";
import { apiClient } from "@/shared/api";
import { formatAddress } from "@/shared/lib/formatAddress";
import { mintERC20 } from "@/shared/lib/web3";
import { Loader } from "@/shared/ui/Loader";
import { PageContainer } from "@/shared/ui/PageContainer";
import { Button } from "@/shared/ui/button";
import { Expandable } from "@/shared/ui/expandable/ui/Expandable";
import { ExpandableContent } from "@/shared/ui/expandable/ui/ExpandableContent";
import { ExpandableTrigger } from "@/shared/ui/expandable/ui/ExpandableTrigger";
import { LogOut } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { useActiveAccount } from "thirdweb/react";

export const AccountPage: React.FC = () => {
  const { logout: signOut } = useAuthSlice();
  const account = useActiveAccount();

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
    <PageContainer hasBackIcon={false} name="Account">
      <div className="flex flex-col">
        <div className="flex gap-5 items-center py-5 px-10 sm:px-20">
          <div className="flex md:flex-row md:gap-3 flex-col items-center">
            <img
              className="rounded-full h-14 md:h-20 aspect-square"
              src={`https://effigy.im/a/${address}.svg`}
              alt="User"
            />
            <p className="text-lg">{formatAddress(address as `0x${string}`)}</p>
          </div>
          <Button
            className="ml-auto"
            variant="destructive"
            size="lg"
            onClick={logout}
          >
            <LogOut />
          </Button>
        </div>
        <div className="w-1/2 h-full flex flex-col justify-between gap-20">
          <Button
            className="mt-8"
            onClick={() =>
              mintERC20(account, 50n)
                .then(() => alert("Minted 50 tokens"))
                .catch(console.error)
            }
          >
            Mint ERC20
          </Button>
        </div>
        <div className="p-5">
          <Expandable defaultOpened>
            <ExpandableTrigger className="w-full my-3 p-3 text-xl flex justify-start gap-3 items-center card">
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
            <ExpandableTrigger className="w-full my-3 p-3 text-xl flex justify-start gap-3 items-center card">
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
            <ExpandableTrigger className="w-full my-3 p-3 text-xl flex justify-start gap-3 items-center card">
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
    </PageContainer>
  );
};
