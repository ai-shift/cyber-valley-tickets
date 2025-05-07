import type { Notification } from "@/entities/notification";
import { useReadNotification } from "../api/useReadNotifiaction";
import { getTimeAgoString } from "../lib/getTimeAgo";

type NotificationCardProps = {
  notification: Notification;
};
export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
}) => {
  const { body, title, seenAt, id, createdAtTimestamp } = notification;

  const isNew = !seenAt;

  const { mutate } = useReadNotification(id);

  function clickHandler() {
    mutate();
  }

  return (
    <button
      disabled={!isNew}
      className="block card border-primary/30 cursor-pointer"
      onClick={clickHandler}
      type="button"
    >
      <div className="flex justify-between items-center w-full">
        <h3>{title}</h3>
        {isNew && <div className="h-5 w-5 rounded-full bg-green-500" />}
      </div>
      <p className="text-start text-sm text-muted">{body}</p>
      <p className="text-start text-white/80 text-xs">
        {getTimeAgoString(createdAtTimestamp)}
      </p>
    </button>
  );
};
