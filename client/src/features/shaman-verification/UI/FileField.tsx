import { Input } from "@/shared/ui/input"

type FileFieldProps = {
  label: string;
  file: File | null;
  setFile: (file: File | null) => void;
}

export const FileField: React.FC<FileFieldProps> = ({label, file, setFile}) => {
  return(
    <label htmlFor="ktp" className="text-xl mb-2 flex flex-col gap-1">
      {label}
        <div className="border-2 border-input bg-input/10 py-1 px-2">
          <p className="text-lg text-muted">
            {file ? file.name : "Choose file"}
          </p>
        </div>
        <Input
          id="ktp"
          type="file"
          hidden
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </label>
  )
}
