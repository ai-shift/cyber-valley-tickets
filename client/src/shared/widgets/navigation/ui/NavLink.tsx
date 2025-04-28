import type { Role } from "@/shared/lib/RBAC";
import type { Route } from "../model/link";

import { NavLink as Link } from "react-router";

type NavLinkProps = {
  route: Route;
  role: Role;
};

const NavLink = ({ route, role }: NavLinkProps) => {
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

export default NavLink;
