type ManageItemProps = {
  title: string;
  render: () => React.ReactNode[];
};

export const ManageItem: React.FC<ManageItemProps> = ({ title, render }) => {
  return (
    <li className="flex py-5 justify-between items-center">
      <h3 className=" text-lg">{title}</h3>
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
