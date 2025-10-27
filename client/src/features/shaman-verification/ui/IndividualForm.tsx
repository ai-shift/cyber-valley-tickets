import { Button } from "@/shared/ui/button";
import { useState } from "react";
import { submitIndividualVerification } from "../api/shamanApi";
import { FileField } from "./FileField";

export const IndividualForm: React.FC = () => {
  const [ktpFile, setKtpFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ktpFile) {
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await submitIndividualVerification(ktpFile);
      console.log("Verification submitted successfully:", result);
      // TODO: Show success message to user
    } catch (error) {
      console.error("Failed to submit verification:", error);
      // TODO: Show error message to user
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <FileField
        label="KTP (owner's passport/ID)"
        file={ktpFile}
        setFile={setKtpFile}
        id="ktp"
      />
      <Button
        type="submit"
        className="mt-4"
        disabled={!ktpFile || isSubmitting}
      >
        {isSubmitting ? "Submitting..." : "Submit"}
      </Button>
    </form>
  );
};
