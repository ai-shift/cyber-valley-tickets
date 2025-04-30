import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/app/styles/global.css";
import { App } from "./App";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} else {
  console.log("No root element found");
}
