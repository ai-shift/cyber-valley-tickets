import { cn } from "@/shared/lib/utils";
import { getCurrencySymbol } from "@/shared/lib/web3";

// TODO: Propagate hard coded price logic to the caller side
type DetailsBlockProps = {
  icon: string;
  title: string;
  information: string;
  className?: string;
};
export const DetailsBlock: React.FC<DetailsBlockProps> = ({
  icon,
  title,
  information,
  className,
}) => {
  return (
    <div
      className={cn(
        "border-secondary border-[1px] px-5 py-3 flex flex-col gap-4",
        className,
      )}
    >
      <div className="flex justify-between itrems-center">
        <img className="h-5" src={icon} alt="title" />
        <p className="text-muted-foreground">{title}</p>
      </div>
      <p className="text-muted">
        {information}{" "}
        {title === "Price" && (
          <>
            {" "}
            <img
              src={getCurrencySymbol()}
              className="h-6 aspect-square inline"
              alt="currency"
            />
          </>
        )}
      </p>
    </div>
  );
};
