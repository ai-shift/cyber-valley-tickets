import { ResultDialog } from "@/shared/ui/ResultDialog";
import { Button } from "@/shared/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router";
import { submitIndividualVerification } from "../api/shamanApi";
import { FileField } from "./FileField";

export const IndividualForm: React.FC = () => {
  const navigate = useNavigate();
  const [ktpFile, setKtpFile] = useState<File | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ktpFile) {
      return;
    }

    try {
      setIsLoading(true);
      await submitIndividualVerification(ktpFile);
      setStatus("success");
      setShowResult(true);
    } catch (error) {
      setStatus("error");
      setShowResult(true);
    } finally {
      setIsLoading(false);
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
      <Button type="submit" className="mt-4" disabled={!ktpFile || isLoading}>
        {isLoading ? "Submitting..." : "Submit"}
      </Button>
      <ResultDialog
        open={showResult}
        setOpen={setShowResult}
        failure={status === "error"}
        onConfirm={() => {
          setStatus("idle");
          navigate("/");
        }}
        title={
          status === "success" ? "Success" : status === "error" ? "Error" : ""
        }
        body={
          status === "success"
            ? "Verification submitted successfully"
            : status === "error"
              ? "Failed to submit verification. Please try again."
              : ""
        }
      />
    </form>
  );
};
