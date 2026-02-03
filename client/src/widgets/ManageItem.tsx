type ManageItemProps = {
  title: React.ReactNode;
  isRequested?: boolean;
  eventDepositSize?: number;
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
        {eventDepositSize !== undefined && eventDepositSize > 0 && (
          <p className="text-sm text-muted-foreground">
            Deposit: {eventDepositSize} USDT
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
