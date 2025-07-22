import { cn } from "../lib/utils";

type LoaderProps = {
  containerClassName?: string;
  className?: string;
};

export const Loader: React.FC<LoaderProps> = ({
  className,
  containerClassName,
}) => {
  return (
    <div
      className={cn(
        "flex w-full aspect-square items-center justify-center",
        containerClassName,
      )}
    >
      <div className={cn("aspect-square h-20", className)}>
        <div className="loader" />
      </div>
    </div>
  );
};
