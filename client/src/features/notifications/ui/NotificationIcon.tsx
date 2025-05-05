import { notificationQueries } from "@/entities/notification";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";

export const NotificationIcon: React.FC = () => {
  const {
    data: notifications,
    isFetching,
    error,
  } = useQuery(notificationQueries.list());

  return <Link to="/notifications">{notifications?.length}</Link>;
};
