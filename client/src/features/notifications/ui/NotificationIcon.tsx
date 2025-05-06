import { notificationQueries } from "@/entities/notification";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";

export const NotificationIcon: React.FC = () => {
  const {
    data: notifications,
    isFetching,
    error,
  } = useQuery(notificationQueries.list());

  return (
    <Link
      to="/notifications"
      className="h-10 aspect-square border-[1px] border-primary rounded flex justify-center items-center"
    >
      <img
        className="h-6"
        src="/icons/nnotification_3.svg"
        alt="notification"
      />
    </Link>
  );
};
