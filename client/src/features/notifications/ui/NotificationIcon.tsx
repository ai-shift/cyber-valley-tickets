import { useAuthSlice } from "@/app/providers";
import { notificationQueries } from "@/entities/notification";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";

export const NotificationIcon: React.FC = () => {
  const { user } = useAuthSlice();
  const { data: notifications } = useQuery(notificationQueries.list());

  const unreadNotifications = notifications?.filter((notif) => !notif.seenAt);
  const hasUnreadNotifications =
    unreadNotifications && unreadNotifications.length > 0;

  if (!user) return;
  return (
    <Link
      to="/notifications"
      className="h-12 aspect-square border-[1px] border-primary rounded flex justify-center items-center relative"
    >
      <img
        className="h-8"
        src="/icons/nnotification_3.svg"
        alt="notification"
      />
      {hasUnreadNotifications && (
        <p className="absolute flex items-center justify-center h-6 w-6 bg-red-500 text-white text-lg rounded-full text-center top-0 right-0 translate-x-3 -translate-y-2">
          {unreadNotifications.length}
        </p>
      )}
    </Link>
  );
};
