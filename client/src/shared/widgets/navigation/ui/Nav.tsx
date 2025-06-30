import { useAuthSlice } from "@/app/providers";

import { cn } from "@/shared/lib/utils";
import { routes } from "../model/routes";
import { NavLink } from "./NavLink";

type NavProps = {
  className?: string;
};

export const Nav: React.FC<NavProps> = ({ className }) => {
  const { user } = useAuthSlice();
  if (!user) return;
  return (
    <nav className={cn("flex justify-around flex-wrap gap-3", className)}>
      {routes.map((route) => (
        <NavLink key={route.path} route={route} role={user.role} />
      ))}
    </nav>
  );
};
