import { useNavigate } from "react-router";

import { EventsList, upcomingFilter } from "@/features/events-list/";
import { NotificationIcon } from "@/features/notifications";
import { mintERC20 } from "@/shared/lib/web3";
import { Button } from "@/shared/ui/button";
import { useActiveAccount } from "thirdweb/react";

export const HomePage: React.FC = () => {
  const account = useActiveAccount();
  const navigate = useNavigate();
  if (!account) return <p>Connect your wallet first</p>;
  return (
    <div className="px-6">
      <h1 className="text-shadow-md text-shadow-primary text-primary text-5xl py-4">
        Cyber Valley
      </h1>
      <div className="w-full h-[1px] bg-primary/30" />
      <div className="flex justify-between items-center py-3">
        <p className="text-xl">Greetings, traveller!</p>
        <NotificationIcon />
      </div>
      <div className="w-full h-[1px] bg-primary/30" />
      <Button
        onClick={() => navigate("/events/create")}
        className="w-full text-center text-2xl mt-8 h-32 card"
      >
        Become SHAMAN
      </Button>
      <section className="mt-8">
        <EventsList filterFn={upcomingFilter} />
      </section>
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
  );
};
