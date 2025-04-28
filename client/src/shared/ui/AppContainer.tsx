import type { ReactNode } from "react";

type AppContainerProps = {
  children: ReactNode;
};

const AppContainer = ({ children }: AppContainerProps) => {
  return (
    <main className="w-screen h-screen py-3 flex justify-center items-center">
      <div className="h-full w-full sm:w-96 lg:w-1/3 sm:border-2 rounded-lg border-gray-700">
        {children}
      </div>
    </main>
  );
};

export default AppContainer;
