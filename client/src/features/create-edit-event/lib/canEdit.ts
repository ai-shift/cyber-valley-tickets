import type { Event } from "@/entities/event";
import type { User } from "@/entities/user";
import { checkPermission } from "@/shared/lib/RBAC";

export const canEdit = (user: User, event: Event) => {
  const isAvailable = ["submitted", "approved"].includes(event.status);
  const editingPermited = checkPermission(user.role, "event:edit");
  const isCreator = event.creator.address === user.address;
  return isAvailable && (editingPermited || isCreator);
};

// TODO: Rename
export const currCanEdit = (user: User) => (event: Event) =>
  canEdit(user, event);
