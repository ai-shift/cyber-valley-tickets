import { notificationQueries } from "@/entities/notification";
import { ErrorMessage } from "@/shared/ui/ErrorMessage";
import { Loader } from "@/shared/ui/Loader";
import { useQuery } from "@tanstack/react-query";
import { NotificationCard } from "./NotificationCard";

export const NotificationsList: React.FC = () => {
  const {
    data: notifications,
    isFetching,
    error,
  } = useQuery(notificationQueries.list());

  if (!notifications && isFetching) {
    return <Loader />;
  }
  if (error) return <ErrorMessage errors={error} />;
  if (!notifications) return <p>No data for some reason</p>;

  if (notifications.length === 0) return <p>You have no notifications</p>;

  return (
    <div className="flex flex-col gap-3">
      {notifications.map((notification) => (
        <NotificationCard
          key={notification.title}
          notification={notification}
        />
      ))}
    </div>
  );
};
