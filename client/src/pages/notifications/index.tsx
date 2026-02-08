import { useReadAllNotifications } from "@/features/notifications";
import { NotificationsList } from "@/features/notifications/ui/NotificationsList";
import { PageContainer } from "@/shared/ui/PageContainer";
import { SearchBar } from "@/shared/ui/SearchBar";
import { Button } from "@/shared/ui/button";
import { Loader2 } from "lucide-react";

const SEARCH_PARAM_NAME = "search";

export const NotificationsPage: React.FC = () => {
  const { mutate: readAll, isPending } = useReadAllNotifications();

  return (
    <PageContainer name="Notifications" hasBackIcon={false}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2 px-3">
          <SearchBar
            paramName={SEARCH_PARAM_NAME}
            placeholder="Search notifications by title or body..."
            className="flex-1"
          />
          <Button
            onClick={() => readAll()}
            disabled={isPending}
            filling="outline"
            size="sm"
            className="whitespace-nowrap"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Read All
          </Button>
        </div>
        <NotificationsList searchParamName={SEARCH_PARAM_NAME} />
      </div>
    </PageContainer>
  );
};
