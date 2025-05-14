import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

import { useNavigate } from "react-router";

type PageContainerProps = {
  name: string;
  children: ReactNode;
  hasBackIcon?: boolean;
};

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  name,
  hasBackIcon = true,
}) => {
  const navigate = useNavigate();
  function goBack() {
    navigate(-1);
  }

  return (
    <div className="w-full flex flex-col items-stretch justify-start">
      <header className="flex justify-start items-center gap-5 py-4 px-5">
        {hasBackIcon && (
          <button className="cursor-pointer" type="button" onClick={goBack}>
            <ArrowLeft size={30} />
          </button>
        )}
        <h2 className="text-2xl font-semibold text-primary text-shadow-primary text-shadow-xs">
          {name}
        </h2>
      </header>
      <div>{children}</div>
    </div>
  );
};
