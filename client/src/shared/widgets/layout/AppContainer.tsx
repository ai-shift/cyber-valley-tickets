import type { ReactNode } from "react";

type AppContainerProps = {
  children: ReactNode;
};

export const AppContainer: React.FC<AppContainerProps> = ({ children }) => {
  return (
    <div className="h-[100dvh] sm:py-3 flex justify-center items-center">
      <main
        id="appContainer"
        className="h-full w-full md:w-8/12 lg:w-1/2 xl:w-5/12 2xl:w-4/12 md:border-2 rounded-3xl border-primary/60 md:overflow-hidden"
      >
        {children}
      </main>
    </div>
  );
};
