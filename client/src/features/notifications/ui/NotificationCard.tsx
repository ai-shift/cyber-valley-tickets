import type { Notification } from "@/entities/notification";
import { useReadNotification } from "../api/useReadNotifiaction";

type NotificationCardProps = {
  notification: Notification;
};
export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
}) => {
  const { body, title, seenAt, id } = notification;

  const isNew = !seenAt;

  const { mutate } = useReadNotification();

  function clickHandler() {
    mutate(id);
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
