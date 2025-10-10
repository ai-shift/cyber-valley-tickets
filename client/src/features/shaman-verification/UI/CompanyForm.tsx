import { Button } from "@/shared/ui/button";
import { useState } from "react";
import { FileField } from "./FileField";

export const CompanyForm: React.FC = () => {
  const [ktpFile, setKtpFile] = useState<File | null>(null);
  const [aktaFile, setAktaFile] = useState<File | null>(null);
  const [skFile, setSkFile] = useState<File | null>(null);

  const allFilesPresent = ktpFile && aktaFile && skFile

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting company documents:", { ktpFile, aktaFile, skFile });
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
      <Button type="submit" className="mt-4" disabled={!allFilesPresent}>
        Submit
      </Button>
    </form>
  );
};
