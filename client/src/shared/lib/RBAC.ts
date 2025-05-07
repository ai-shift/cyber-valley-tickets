import type { components } from "@/shared/api";

export type Role = components["schemas"]["RoleEnum"];

export type Resource = "*" | "event" | "place" | "ticket";
export type Action =
  | "*"
  | "create"
  | "read"
  | "edit"
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
  master: {
    "*": ["*"],
  },
};

export type Permissions = `${Exclude<Resource, "*">}:${Exclude<Action, "*">}`;

export function checkPermission(role: Role, permission: Permissions) {
  const [source, action] = permission.split(":") as [Resource, Action];

  const rolePermissions = RBAC_ROLES[role];
  if (!rolePermissions) return false;

  const permittedActions = rolePermissions["*"] || rolePermissions[source];
  if (!permittedActions) return false;

  return permittedActions.includes("*") || permittedActions.includes(action);
}
