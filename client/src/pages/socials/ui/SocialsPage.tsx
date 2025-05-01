import { useState } from "react";
import { Navigate, useNavigate } from "react-router";

import { useOrderStore } from "@/entities/order";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

export const SocialsPage: React.FC = () => {
  const [socials, setSocials] = useState("");
  const { setSocialsToTicketOrder } = useOrderStore();
  const order = useOrderStore((state) => state.order);
  const navigate = useNavigate();

  function proceedToChekout() {
    if (!socials) return;
    setSocialsToTicketOrder(socials);
    setSocials("");
    navigate("/purchase");
    console.log(order);
  }

  if (!order) return <Navigate to="/events" />;

  return (
    <div>
      <form className="py-10 px-10 space-y-10">
        <label
          className="text-2xl text-bold text-center flex flex-col gap-10"
          htmlFor="socials"
        >
          Please enter your social
          <Input
            id="socials"
            value={socials}
            onChange={(e) => setSocials(e.target.value)}
          />
        </label>
      </form>

      <Button
        className="mx-auto block"
        onClick={proceedToChekout}
        type="submit"
      >
        Buy ticket
      </Button>
    </div>
  );
};
