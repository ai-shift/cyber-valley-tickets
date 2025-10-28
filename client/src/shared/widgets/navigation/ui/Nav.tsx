import { useAuthSlice } from "@/app/providers";

import { notificationQueries } from "@/entities/notification";
import { cn } from "@/shared/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { routes } from "../model/routes";
import { NavLink } from "./NavLink";

type NavProps = {
  className?: string;
};

export const Nav: React.FC<NavProps> = ({ className }) => {
  const { user } = useAuthSlice();
  const { data: notifications } = useQuery(notificationQueries.list());
  const unreadCount = notifications?.filter((n) => !n.seenAt).length || 0;

  if (!user) return;
  return (
    <nav className={cn("flex justify-around flex-wrap gap-1", className)}>
      {routes.map((route) => (
        <NavLink
          key={route.path}
          route={route}
          role={user.role}
          badgeText={
            route.path === "/notifications" ? String(unreadCount) : undefined
          }
        />
      ))}
    </nav>
  );
};
