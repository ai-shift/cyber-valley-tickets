import { NotificationsList } from "@/features/notifications/ui/NotificationsList";
import { PageContainer } from "@/shared/ui/PageContainer";
import { SearchBar } from "@/shared/ui/SearchBar";
import { useSearchParams } from "react-router";

export const NotificationsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || undefined;

  return (
    <PageContainer name="Notifications" hasBackIcon={false}>
      <div className="flex flex-col gap-4">
        <SearchBar placeholder="Search notifications by title or body..." />
        <NotificationsList searchQuery={searchQuery} />
      </div>
    </PageContainer>
  );
};
