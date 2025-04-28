import type { ReactNode } from "react";

import { useNavigate } from "react-router";

type PageContainerProps = {
  name: string;
  children: ReactNode;
};

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  name,
}) => {
  const navigate = useNavigate();
  function goBack() {
    navigate(-1);
  }

  return (
    <div className="flex flex-col items-stretch justify-start">
      <header className="flex justify-between items-center">
        <h2>{name}</h2>
        <button type="button" onClick={goBack}>
          Back
        </button>
      </header>
      <div>{children}</div>
    </div>
  );
};
