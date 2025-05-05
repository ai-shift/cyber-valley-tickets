import { Scanner } from "@yudiel/react-qr-scanner";
import { useState } from "react";

import { Button } from "@/shared/ui/button";

// TODO: @scipunch add web3 bind
export const Redeem: React.FC = () => {
  const [open, setOpen] = useState(false);

  const toggelOpen = () => {
    setOpen((prev) => !prev);
  };
  return (
    <div className="flex flex-col justify-center ">
      <Button onClick={toggelOpen}>Redeem ticket</Button>
      {open && <Scanner onScan={(e) => console.log(e)} />}
    </div>
  );
};
