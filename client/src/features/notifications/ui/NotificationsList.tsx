import { notificationQueries } from "@/entities/notification";
import { useQuery } from "@tanstack/react-query";
import { NotificationCard } from "./NotificationCard";

export const NotificationsList: React.FC = () => {
  const {
    data: notifications,
    isFetching,
    error,
  } = useQuery(notificationQueries.list());

  //TODO optimize conditional rendering logic
  if (isFetching) return <p>Loading</p>;
  if (error) return <p>{error.message}</p>;
  if (!notifications) return <p>No data for some reason</p>;

  if (notifications.length === 0) return <p>You have no notification</p>;

  return (
    <div>
      {notifications.map((notification) => (
        <NotificationCard
          key={notification.title}
          notification={notification}
        />
      ))}
    </div>
  );
};
