import { AppContainer } from "@/shared/widgets/layout/AppContainer";
import { ThirdwebProvider } from "thirdweb/react";
import { Router } from "../routes/Router";

export const App = () => {
  return (
    <AppContainer>
      <ThirdwebProvider>
        <Router />
      </ThirdwebProvider>
    </AppContainer>
  );
};
