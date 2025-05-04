import type { Event } from "@/entities/event";
import type { User } from "@/entities/user";
import { checkPermission } from "@/shared/lib/RBAC";

export const canEdit = (user: User, event: Event) => {
  const eventPending = event.status === "submitted";
  const editingPermited = checkPermission(user.role, "event:edit");
  const isCreator = event.creator.address === user.address;

  return eventPending && (editingPermited || isCreator);
};

export const currCanEdit = (user: User) => (event: Event) =>
  canEdit(user, event);
