import type { ApiError } from "../api/apiClient";
import { errorMapper } from "../api/errorMapper";
import { cn } from "../lib/utils";

type ErrorMessageProps = {
  // TS sucks, so null is required to get rid of it's yelling
  errors: ApiError | ApiError[] | Error | string | null;
  className?: string;
};

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  errors,
  className,
}) => {
  console.error("Got error", errors);
  const formattedErrors = new Set<string>();

  if (Array.isArray(errors)) {
    for (const error of errors) {
      for (const stringErrors of errorMapper(error)) {
        formattedErrors.add(stringErrors);
      }
    }
  } else if (typeof errors === "string") {
    formattedErrors.add(errors);
  } else if (errors == null) {
    formattedErrors.add("Empty error message");
  } else if ("errors" in errors) {
    for (const stringErrors of errorMapper(errors)) {
      formattedErrors.add(stringErrors);
    }
  } else if ("message" in errors) {
    formattedErrors.add(errors.message);
  }

  return (
    <div className="w-full aspect-square flex flex-col gap-3 items-center justify-center text-center">
      {[...formattedErrors].map((err) => (
        <p
          className={cn("text-destructive/90 text-lg font-semibold", className)}
          key={err}
        >
          {err}
        </p>
      ))}
    </div>
  );
};
