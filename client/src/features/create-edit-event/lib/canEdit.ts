import type { Event } from "@/entities/event";
import type { User } from "@/entities/user";
import { checkPermission } from "@/shared/lib/RBAC";

export const canEdit = (user: User, event: Event) => {
  const isAvailable = ["submitted", "approved"].includes(event.status ?? "");
  const editingPermited = checkPermission(user.roles, "event:edit");
  const isCreator = event.creator.address === user.address;
  return isAvailable && (editingPermited || isCreator);
};

export const canUserEdit = (user: User) => (event: Event) =>
  canEdit(user, event);
