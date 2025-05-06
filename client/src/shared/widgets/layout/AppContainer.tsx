import type { ReactNode } from "react";

type AppContainerProps = {
  children: ReactNode;
};

export const AppContainer: React.FC<AppContainerProps> = ({ children }) => {
  return (
    <div className="w-screen h-screen sm:py-3 flex justify-center items-center">
      <main
        id="appContainer"
        className="h-full w-full sm:w-2/3 md:w-3/5 lg:w-1/2 xl:w-1/3 sm:border-2 rounded-3xl border-primary/60"
      >
        {children}
      </main>
    </div>
  );
};
