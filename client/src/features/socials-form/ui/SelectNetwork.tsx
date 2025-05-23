import type { components } from "@/shared/api/apiTypes";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

type NetworkEnum = components["schemas"]["NetworkEnum"];
const networks: NetworkEnum[] = [
  "telegram",
  "whatsapp",
  "instagram",
  "discord",
];

const networkTitles: { [K in NetworkEnum]: string } = {
  telegram: "Telegram",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  discord: "Discord",
};

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
              {networkTitles[network]}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
