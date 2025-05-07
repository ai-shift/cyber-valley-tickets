import { NotificationsList } from "@/features/notifications/ui/NotificationsList";
import { PageContainer } from "@/shared/ui/PageContainer";

export const NotificationsPage: React.FC = () => {
  return (
    <PageContainer name="Notifications">
      <NotificationsList />
    </PageContainer>
  );
};
