import { NotificationsList } from "@/features/notifications/ui/NotificationsList";
import { PageContainer } from "@/shared/ui/PageContainer";
import { SearchBar } from "@/shared/ui/SearchBar";

const SEARCH_PARAM_NAME = "search";

export const NotificationsPage: React.FC = () => {
  return (
    <PageContainer name="Notifications" hasBackIcon={false}>
      <div className="flex flex-col gap-4">
        <SearchBar
          paramName={SEARCH_PARAM_NAME}
          placeholder="Search notifications by title or body..."
        />
        <NotificationsList searchParamName={SEARCH_PARAM_NAME} />
      </div>
    </PageContainer>
  );
};
