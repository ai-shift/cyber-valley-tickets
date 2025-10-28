type ManageItemProps = {
  title: string;
  isRequested?: boolean;
  render: () => React.ReactNode[];
};

export const ManageItem: React.FC<ManageItemProps> = ({
  title,
  isRequested,
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
