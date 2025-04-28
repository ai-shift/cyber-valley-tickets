export type Role = "master" | "staff" | "creator" | "user";
export type Resource = "*" | "event" | "place" | "ticket";
export type Action = "*" | "create" | "read" | "edit" | "delete";

type PartialRecord<K extends string | number | symbol, T> = { [P in K]?: T };
type ResourceActions = PartialRecord<Resource, Action[]>;

export type RoleControl = {
  [key in Role]: ResourceActions;
};

export const RBAC_ROLES: RoleControl = {
  master: {
    "*": ["*"],
  },
  staff: {
    event: [],
  },
  creator: {},
  user: {},
};

export type Permissions = `${Resource}:${Action}`;

export function checkPermission(role: Role, permission: Permissions) {
  const [source, action] = permission.split(":") as [Resource, Action];

  const rolePermissions = RBAC_ROLES[role];
  if (!rolePermissions) return false;

  const permittedActions = rolePermissions["*"] || rolePermissions[source];
  if (!permittedActions) return false;

  return permittedActions.includes("*") || permittedActions.includes(action);
}
