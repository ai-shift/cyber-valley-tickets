import { debounce } from "@/shared/lib/debounce";
import { cn } from "@/shared/lib/utils";
import { Search, X } from "lucide-react";
import { useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { Input } from "./input";

interface SearchBarProps {
  paramName?: string;
  placeholder?: string;
  className?: string;
}

export function SearchBar({
  paramName = "search",
  placeholder = "Search...",
  className,
}: SearchBarProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputValue, setInputValue] = useState(
    searchParams.get(paramName) || "",
  );

  const debouncedUpdateUrlRef = useRef(
    debounce((value: string, currentParams: URLSearchParams) => {
      const newParams = new URLSearchParams(currentParams);
      if (value) {
        newParams.set(paramName, value);
      } else {
        newParams.delete(paramName);
      }
      setSearchParams(newParams);
    }, 300),
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    debouncedUpdateUrlRef.current(value, searchParams);
  };

  const handleClear = () => {
    setInputValue("");
    const newParams = new URLSearchParams(searchParams);
    newParams.delete(paramName);
    setSearchParams(newParams);
  };

  return (
    <div className={cn("relative flex items-center", className)}>
      <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="pl-9 pr-9"
      />
      {inputValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 flex h-4 w-4 items-center justify-center rounded-full bg-muted-foreground/20 text-muted-foreground hover:bg-muted-foreground/30"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
