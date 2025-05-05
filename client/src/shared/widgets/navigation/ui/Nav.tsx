import { useUser } from "@/entities/user";
import { useQuery } from "@tanstack/react-query";

import { routes } from "../model/routes";
import { NavLink } from "./NavLink";
import { cn } from "@/shared/lib/utils";

type NavProps = {
  className?: string;
};

export const Nav: React.FC<NavProps> = ({ className }) => {
  //   const { user } = useUser();
  //TODO: Import from the auth store
  const user = { role: "master" };

  return (
    <nav className={cn("flex justify-around gap-3", className)}>
      {routes.map((route) => (
        <NavLink key={route.path} route={route} role={user.role} />
      ))}
    </nav>
  );
};
