import type { components } from "@/shared/api";

export type Role = components["schemas"]["RoleEnum"];

export type Resource = "event" | "place" | "ticket" | "staff" | "localprovider";
export type Action =
  | "create"
  | "read"
  | "edit"
  | "request"
  | "delete"
  | "purchase"
  | "redeem"
  | "accept/decline";

type PartialRecord<K extends string | number | symbol, T> = { [P in K]?: T };
type ResourceActions = PartialRecord<Resource, Action[]>;

export type RoleControl = {
  [key in Role]: ResourceActions;
};

export const RBAC_ROLES: RoleControl = {
  customer: {
    event: ["read", "create"],
    ticket: ["purchase"],
  },
  creator: {
    event: ["read", "create"],
    ticket: ["purchase"],
  },
  staff: {
    event: ["read", "create"],
    ticket: ["redeem"],
  },
  verifiedshaman: {
    event: ["read", "create"],
    ticket: ["purchase"],
    place: ["request"],
  },
  localprovider: {
    event: ["read", "create", "edit", "accept/decline"],
    ticket: ["redeem"],
    place: ["create", "accept/decline", "edit"],
    staff: ["create", "delete"],
  },
  master: {
    localprovider: ["create", "delete"],
  },
};

export type Permissions = `${Resource}:${Action}`;

export function checkPermission(role: Role, ...permissions: Permissions[]) {
  for (const permission of permissions) {
    const [source, action] = permission.split(":") as [Resource, Action];

    const rolePermissions = RBAC_ROLES[role];
    if (!rolePermissions) return false;

    const permittedActions = rolePermissions[source];
    if (!permittedActions) return false;

    if (!permittedActions.includes(action)) {
      return false;
    }
  }
  return true;
}
