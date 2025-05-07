import { Scanner } from "@yudiel/react-qr-scanner";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/shared/ui/dialog";

// TODO: @scipunch add web3 bind
export const Redeem: React.FC = () => {
  return (
    <div className="flex flex-col justify-center ">
      <Dialog>
        <DialogTrigger>
          <Button>Redeem ticket</Button>
        </DialogTrigger>
        <DialogContent className="p-16">
          <Scanner onScan={(e) => console.log(e)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};
