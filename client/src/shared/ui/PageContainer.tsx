import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

import { useNavigate } from "react-router";

type PageContainerProps = {
  name: string;
  children: ReactNode;
  hasBackIcon?: boolean;
  onBack?: () => void;
  rightSlot?: ReactNode;
};

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  name,
  hasBackIcon = true,
  onBack,
  rightSlot,
}) => {
  const navigate = useNavigate();
  function goBack() {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  }

  return (
    <div className="w-full flex flex-col items-stretch justify-start">
      <header className="flex items-center gap-3 py-4 px-5">
        <div className="flex items-center gap-5 min-w-0 flex-1">
          {hasBackIcon && (
            <button className="cursor-pointer" type="button" onClick={goBack}>
              <ArrowLeft size={30} />
            </button>
          )}
          <h2 className="text-2xl font-semibold text-primary text-shadow-primary text-shadow-xs truncate">
            {name}
          </h2>
        </div>
        {rightSlot && <div className="shrink-0">{rightSlot}</div>}
      </header>
      <div>{children}</div>
    </div>
  );
};
