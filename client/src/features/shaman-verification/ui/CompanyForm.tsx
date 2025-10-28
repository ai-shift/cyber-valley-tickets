import { Button } from "@/shared/ui/button";
import { ResultDialog } from "@/shared/ui/ResultDialog";
import { useState } from "react";
import { submitCompanyVerification } from "../api/shamanApi";
import { FileField } from "./FileField";

export const CompanyForm: React.FC = () => {
  const [ktpFile, setKtpFile] = useState<File | null>(null);
  const [aktaFile, setAktaFile] = useState<File | null>(null);
  const [skFile, setSkFile] = useState<File | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [isLoading, setIsLoading] = useState(false);

  const allFilesPresent = ktpFile && aktaFile && skFile;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ktpFile || !aktaFile || !skFile) {
      return;
    }

    try {
      setIsLoading(true);
      await submitCompanyVerification(ktpFile, aktaFile, skFile);
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
    <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
      <FileField
        label="KTP or passport director/authorized person (if applicable)"
        file={ktpFile}
        setFile={setKtpFile}
        id="ktp-director"
      />
      <FileField
        label="Incorporation documents (Akta Pendirian)"
        file={aktaFile}
        setFile={setAktaFile}
        id="akta-pendirian"
      />
      <FileField
        label="SK Kemenkumham (registration with the Ministry of Law and Human Rights)"
        file={skFile}
        setFile={setSkFile}
        id="sk-kemenkumham"
      />
      <Button
        type="submit"
        className="mt-4"
        disabled={!allFilesPresent || isLoading}
      >
        {isLoading ? "Submitting..." : "Submit"}
      </Button>
      <ResultDialog
        open={showResult}
        setOpen={setShowResult}
        failure={status === "error"}
        onConfirm={() => setStatus("idle")}
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
