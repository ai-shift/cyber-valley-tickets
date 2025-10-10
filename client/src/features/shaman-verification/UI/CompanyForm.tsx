import { useState } from "react";

export const CompanyForm: React.FC = () => {
  const [ktpFile, setKtpFile] = useState<File | null>(null);
  const [aktaFile, setAktaFile] = useState<File | null>(null);
  const [skFile, setSkFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log("Submitting company documents:", { ktpFile, aktaFile, skFile });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="ktp-director"
          className="block text-sm font-medium mb-2"
        >
          KTP or passport director/authorized person (if applicable)
        </label>
        <input
          id="ktp-director"
          type="file"
          onChange={(e) => setKtpFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>
      <div>
        <label
          htmlFor="akta-pendirian"
          className="block text-sm font-medium mb-2"
        >
          Incorporation documents (Akta Pendirian)
        </label>
        <input
          id="akta-pendirian"
          type="file"
          onChange={(e) => setAktaFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>
      <div>
        <label
          htmlFor="sk-kemenkumham"
          className="block text-sm font-medium mb-2"
        >
          SK Kemenkumham (registration with the Ministry of Law and Human
          Rights)
        </label>
        <input
          id="sk-kemenkumham"
          type="file"
          onChange={(e) => setSkFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>
      <button
        type="submit"
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Submit Documents
      </button>
    </form>
  );
};
