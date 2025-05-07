import { cn } from "../lib/utils";

type LoaderProps = {
  className?: string;
};

export const Loader: React.FC<LoaderProps> = ({ className }) => {
  return (
    <div className={cn("aspect-square h-20", className)}>
      <div className="loader" />
    </div>
  );
};
