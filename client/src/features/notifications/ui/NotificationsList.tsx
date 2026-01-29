import { notificationQueries } from "@/entities/notification";
import { ErrorMessage } from "@/shared/ui/ErrorMessage";
import { Loader } from "@/shared/ui/Loader";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
import { NotificationCard } from "./NotificationCard";

interface NotificationsListProps {
  searchParamName?: string;
}

export const NotificationsList: React.FC<NotificationsListProps> = ({
  searchParamName = "search",
}) => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get(searchParamName) || undefined;

  const {
    data: notifications,
    isLoading,
    error,
  } = useQuery(notificationQueries.list(searchQuery));

  if (isLoading) {
    return <Loader />;
  }
  if (error) return <ErrorMessage errors={error} />;
  if (!notifications) return <p>No data for some reason</p>;

  if (notifications.length === 0) {
    return <p className="text-center mt-48">You have no notifications</p>;
  }

  return (
    <div className="flex flex-col gap-3 px-3">
      {notifications.map((notification) => (
        <NotificationCard key={notification.id} notification={notification} />
      ))}
    </div>
  );
};
