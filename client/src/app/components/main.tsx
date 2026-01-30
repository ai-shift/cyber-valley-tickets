import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/app/styles/global.css";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { Button } from "@/shared/ui/button";
import { App } from "./App";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <ErrorBoundary
        fallback={
          <div className="h-screen flex flex-col justify-center items-center">
            <h1>
              Some very unexpected error happened. We will try our best to fix
              it as soon as possible
            </h1>
            <Button
              onClick={() => {
                window.location.href = "/";
              }}
            >
              Go to main page
            </Button>
          </div>
        }
      >
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
} else {
  console.log("No root element found");
}
