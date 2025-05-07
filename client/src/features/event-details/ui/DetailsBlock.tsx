import type { ReactNode } from "react";

type DetailsBlockProps = {
  icon: ReactNode;
  title: string;
  information: string;
};
export const DetailsBlock: React.FC<DetailsBlockProps> = ({
  icon,
  title,
  information,
}) => {
  return (
    <div className="py-2 px-5 flex-1">
      <div className="flex justify-between itrems-center">
        {icon}
        <p>{title}</p>
      </div>
      <p>{information}</p>
    </div>
  );
};
