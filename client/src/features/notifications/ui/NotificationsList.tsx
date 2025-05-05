import { notificationQueries } from "@/entities/notification";
import { useQuery } from "@tanstack/react-query";
import { NotificationCard } from "./NotificationCard";
import { ErrorMessage } from "@/shared/ui/ErrorMessage";

export const NotificationsList: React.FC = () => {
  const {
    data: notifications,
    isFetching,
    error,
  } = useQuery(notificationQueries.list());

  if (isFetching) return <p>Loading</p>;
  if (error) return <ErrorMessage errors={error} />;
  if (!notifications) return <p>No data for some reason</p>;

  if (notifications.length === 0) return <p>You have no notifications</p>;

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
