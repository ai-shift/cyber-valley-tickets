import type { Event } from "@/entities/event";
import type { User } from "@/entities/user";
import { checkPermission } from "@/shared/lib/RBAC";

type ManageEventProps = {
  user: User;
  event: Event;
};

export const ManageEvent: React.FC<ManageEventProps> = ({ user, event }) => {
  if (event.status === "approved") return;

  checkPermission(user.role, "event:edit");
  return <div>s</div>;
};
