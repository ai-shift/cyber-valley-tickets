import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

const networks = ["Telegram", "WhatsApp", "X", "Discord"];

type SelectNetworkProps = {
  networkName: string;
  onChange: (networkName: string) => void;
};

export const SelectNetwork: React.FC<SelectNetworkProps> = ({
  networkName,
  onChange,
}) => {
  return (
    <Select value={networkName} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a network" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {networks.map((network) => (
            <SelectItem key={network} value={network}>
              {network}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
