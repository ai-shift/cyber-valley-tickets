import { AppContainer } from "@/shared/ui/AppContainer";
import { QueryProvider } from "../providers/QueryProvider";
import { Router } from "../routes/Router";

export const App = () => {
  return (
    <QueryProvider>
      <AppContainer>
        <Router />
      </AppContainer>
    </QueryProvider>
  );
};
