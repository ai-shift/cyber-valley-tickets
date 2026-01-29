import { notificationQueries } from "@/entities/notification";
import { ErrorMessage } from "@/shared/ui/ErrorMessage";
import { Loader } from "@/shared/ui/Loader";
import { SearchBar } from "@/shared/ui/SearchBar";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
import { NotificationCard } from "./NotificationCard";

export const NotificationsList: React.FC = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || undefined;
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

  return (
    <div className="flex flex-col gap-4">
      <SearchBar placeholder="Search notifications by title or body..." />
      {notifications.length === 0 ? (
        <p className="text-center mt-48">You have no notifications</p>
      ) : (
        <div className="flex flex-col gap-3 px-3">
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
            />
          ))}
        </div>
      )}
    </div>
  );
};
