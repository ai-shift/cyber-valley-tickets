import type { ReactNode } from "react";

type AppContainerProps = {
  children: ReactNode;
};

export const AppContainer: React.FC<AppContainerProps> = ({ children }) => {
  return (
    <div className="w-screen h-screen sm:py-3 flex justify-center items-center">
      <main
        id="appContainer"
        className="h-full sm:aspect-9/18 sm:border-2 rounded-3xl border-primary/60 overflow-hidden"
      >
        {children}
      </main>
    </div>
  );
};
