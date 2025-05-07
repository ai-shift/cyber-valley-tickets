import type { Role } from "@/shared/lib/RBAC";
import type { Route } from "../model/routes";
import { useLocation } from "react-router";
import { NavLink as Link } from "react-router";

type NavLinkProps = {
  route: Route;
  role: Role;
};

export const NavLink: React.FC<NavLinkProps> = ({ route, role }) => {
  const { path, title, restrictedTo } = route;
  const { pathname } = useLocation();

  const isCurrent = path === "/" ? pathname === "/" : pathname.startsWith(path);
  const icon = title.toLowerCase();

  const canDisplay = !restrictedTo || restrictedTo.includes(role);

  return (
    canDisplay && (
      <Link
        to={path}
        className={({ isActive }) =>
          `flex-1 flex flex-col items-center text-center clip-corners px-4 py-2 border-[1px] border-primary font-semibold ${isActive ? "text-black bg-primary" : "text-primary"}`
        }
      >
        <img
          className="aspect-square h-8"
          src={`/icons/${isCurrent ? `${icon}_active` : icon}.svg`}
          alt={title}
        />
        {title}
      </Link>
    )
  );
};
