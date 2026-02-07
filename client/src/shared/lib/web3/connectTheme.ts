import { darkTheme } from "thirdweb/react";

// Shared Thirdweb modal theme. Keep it consistent across Login + Account screens.
export const connectTheme = darkTheme({
  colors: {
    borderColor: "var(--secondary)",
    accentButtonBg: "var(--primary)",
    accentButtonText: "var(--foreground)",
    accentText: "var(--primary)",
    modalBg: "var(--background)",
    primaryButtonBg: "var(--primary)",
    primaryButtonText: "var(--foreground)",
    secondaryButtonBg: "#010101",
    secondaryButtonText: "#e2e2e2",
    secondaryText: "#e2e2e2",
  },
  fontFamily: "var(--font-chakra-petch)",
});

