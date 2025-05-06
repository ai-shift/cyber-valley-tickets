import type React from "react";
import { useAuth } from "../hooks/useAuth";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  //   useAuth();

  return <>{children}</>;
};
