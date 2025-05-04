import type { Notification } from "@/entities/notification";
import { useReadNotification } from "../api/useReadNotifiaction";

type NotificationCardProps = {
  notification: Notification;
};
export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
}) => {
  const { body, title, seenAt } = notification;

  const isNew = !seenAt;

  const { mutate } = useReadNotification();

  // TODO: Use notification id as int
  function clickHandler() {
    mutate("1");
  }

  return (
    <button onClick={clickHandler} type="button">
      <div className="flex justify-between items-center">
        <h3>{title}</h3>
        {isNew && <div className="h-5 w-5 rounded-full bg-green-500" />}
      </div>
      <p>{body}</p>
    </button>
  );
};
