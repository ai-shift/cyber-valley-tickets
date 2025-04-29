import { AppContainer } from "@/shared/ui/AppContainer";
import { Router } from "../routes/Router";
import { QueryProvider } from "../providers/QueryProvider";

export const App = () => {
  return (
    <QueryProvider>
      <AppContainer>
        <Router />
      </AppContainer>
    </QueryProvider>
  );
};
