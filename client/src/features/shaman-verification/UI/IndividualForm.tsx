import { Button } from "@/shared/ui/button";
import { useState } from "react";
import { FileField } from "./FileField";

export const IndividualForm: React.FC = () => {
  const [ktpFile, setKtpFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting individual document:", { ktpFile });
  };

  return (
    <form onSubmit={handleSubmit}>
      <FileField
        label="KTP (owner’s passport/ID)"
        file={ktpFile}
        setFile={setKtpFile}
        id="ktp"
      />
      <Button type="submit" className="mt-4">
        Submit
      </Button>
    </form>
  );
};
