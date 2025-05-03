import { useUser } from "@/entities/user";
import { useQuery } from "@tanstack/react-query";

import { routes } from "../model/routes";
import { NavLink } from "./NavLink";

export const Nav = () => {
  //   const { user } = useUser();
  //TODO: Import from the auth store
  const user = { role: "master" };

  return (
    <nav className="flex flex-col">
      {routes.map((route) => (
        <NavLink key={route.path} route={route} role={user.role} />
      ))}
    </nav>
  );
};
