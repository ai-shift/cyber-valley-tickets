import { formatUsdt } from "@/shared/lib/money/usdt";

type ManageItemProps = {
  title: React.ReactNode;
  isRequested?: boolean;
  eventDepositSize?: string;
  render: () => React.ReactNode[];
};

export const ManageItem: React.FC<ManageItemProps> = ({
  title,
  isRequested,
  eventDepositSize,
  render,
}) => {
  return (
    <li className="flex py-5 justify-between items-center">
      <div>
        <h3 className="text-lg">{title}</h3>
        {isRequested && (
          <p className="text-black text-md px-1 leading-5 bg-primary">
            requested
          </p>
        )}
        {eventDepositSize !== undefined && BigInt(eventDepositSize) > 0n && (
          <p className="text-sm text-muted-foreground">
            Deposit: {formatUsdt(BigInt(eventDepositSize))} USDT
          </p>
        )}
      </div>
      <ul className="flex flex-row gap-3">
        {render().map((node, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: The order won't ever change
          <li className="h-12" key={index}>
            {node}
          </li>
        ))}
      </ul>
    </li>
  );
};
