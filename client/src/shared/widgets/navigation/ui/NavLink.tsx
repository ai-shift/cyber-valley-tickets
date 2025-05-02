import type { Role } from "@/shared/lib/RBAC";
import type { Route } from "../model/routes";

import { NavLink as Link } from "react-router";

type NavLinkProps = {
  route: Route;
  role: Role;
};

export const NavLink: React.FC<NavLinkProps> = ({ route, role }) => {
  const { path, title, restrictedTo } = route;

  const canDisplay = !restrictedTo || restrictedTo.includes(role);

  return (
    canDisplay && (
      <Link to={path} className={({ isActive }) => (isActive ? "" : "")}>
        {title}
      </Link>
    )
  );
};
