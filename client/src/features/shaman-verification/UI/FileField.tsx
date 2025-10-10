import { Input } from "@/shared/ui/input";

type FileFieldProps = {
  label: string;
  file: File | null;
  setFile: (file: File | null) => void;
  id: string;
};

export const FileField: React.FC<FileFieldProps> = ({
  label,
  file,
  setFile,
  id,
}) => {
  return (
    <label htmlFor={id} className="text-xl mb-2 flex flex-col gap-1">
      {label}
      <div className="border-2 border-input bg-input/10 py-1 px-2">
        <p className="text-lg text-muted">{file ? file.name : "Choose file"}</p>
      </div>
      <Input
        id={id}
        type="file"
        hidden
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
    </label>
  );
};
