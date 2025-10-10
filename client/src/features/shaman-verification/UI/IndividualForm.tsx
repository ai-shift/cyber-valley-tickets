import { useState } from "react";
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"

export const IndividualForm: React.FC = () => {
  const [ktpFile, setKtpFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log("Submitting individual document:", { ktpFile });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
        <label htmlFor="ktp" className="block text-sm font-medium mb-2">
          KTP (owner’s passport/ID)
        <Input
          id="ktp"
          type="file"
          onChange={(e) => setKtpFile(e.target.files?.[0] || null)}
        />
      </label>
      <Button
        type="submit"
      >
        Submit Document
      </Button>
    </form>
  );
};
