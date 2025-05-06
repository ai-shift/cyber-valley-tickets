import type { ApiError } from "../api/apiClient";
import { errorMapper } from "../api/errorMapper";

type ErrorMessageProps = {
  errors: ApiError | ApiError[];
  className?: string;
};

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  errors,
  className,
}) => {
  const formattedErrors = new Set<string>();

  if (Array.isArray(errors)) {
    for (const error of errors) {
      for (const stringErrors of errorMapper(error)) {
        formattedErrors.add(stringErrors);
      }
    }
  } else {
    for (const stringErrors of errorMapper(errors)) {
      formattedErrors.add(stringErrors);
    }
  }

  return (
    <div className="flex flex-col">
      {[...formattedErrors].map((err) => (
        <p className={className} key={err}>
          {err}
        </p>
      ))}
    </div>
  );
};
