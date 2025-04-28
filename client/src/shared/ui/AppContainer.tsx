import type { ReactNode } from "react";

type AppContainerProps = {
  children: ReactNode;
};

export const AppContainer: React.FC<AppContainerProps> = ({ children }) => {
  return (
    <div className="w-screen h-screen py-3 flex justify-center items-center">
      <main
        id="appContainer"
        className="h-full w-full sm:w-96 lg:w-1/3 sm:border-2 rounded-lg border-gray-700 overflow-y-auto overflow-x-hidden"
      >
        {children}
      </main>
    </div>
  );
};
