import { type Role, checkView } from "@/shared/lib/RBAC";
import { useLocation } from "react-router";
import { NavLink as Link } from "react-router";
import type { Route } from "../model/routes";

type NavLinkProps = {
  route: Route;
  role?: Role;
  badgeText?: string;
};

export const NavLink: React.FC<NavLinkProps> = ({ route, role, badgeText }) => {
  const { path, title, icon, view, requireLogin } = route;
  const { pathname } = useLocation();

  const isCurrent = path === "/" ? pathname === "/" : pathname.startsWith(path);
  const iconName = icon || title.toLowerCase();

  const isLogged = !requireLogin || role != null
  const canDisplay = !view || checkView(role, view);
  const showBadge = badgeText && badgeText !== "0";

  return (
    canDisplay && isLogged && (
      <Link
        to={path}
        className={({ isActive }) =>
          `flex-1 flex flex-col items-center text-center clip-corners px-1 py-1 border-[1px] border-primary font-semibold relative ${isActive ? "text-black bg-primary" : "text-primary"}`
        }
      >
        <img
          className="aspect-square h-6"
          src={`/icons/${isCurrent ? `${iconName}_active` : iconName}.svg`}
          alt={title}
        />
        <p className="text-xs">{title}</p>
        {showBadge && (
          <span className="absolute flex items-center justify-center h-3 w-3 bg-red-500 text-white text-[8px] rounded-full top-1 right-1">
            {badgeText}
          </span>
        )}
      </Link>
    )
  );
};
