import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { useState } from "react";
import { isValidEthereumAddress } from "../lib/storage";

interface ReferralInputProps {
  onSubmit: (address: string) => void;
  initialValue?: string;
}

export const ReferralInput: React.FC<ReferralInputProps> = ({
  onSubmit,
  initialValue = "",
}) => {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!value.trim()) {
      setError("Please enter a referral address");
      return;
    }

    if (!isValidEthereumAddress(value.trim())) {
      setError("Invalid Ethereum address");
      return;
    }

    setError(null);
    onSubmit(value.trim().toLowerCase());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Enter referral address (0x...)"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          className="flex-1"
        />
        <Button onClick={handleSubmit} filling="outline">
          Apply
        </Button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};
