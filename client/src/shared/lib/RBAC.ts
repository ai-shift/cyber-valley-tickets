/**
 * Role type - based on the backend's role system.
 * These roles are returned from the API as strings.
 */
export type Role =
  | "customer"
  | "creator"
  | "staff"
  | "localprovider"
  | "verifiedshaman"
  | "master";

export type Resource =
  | "event"
  | "place"
  | "ticket"
  | "staff"
  | "localprovider"
  | "category";
export type Action =
  | "create"
  | "read"
  | "edit"
  | "request"
  | "delete"
  | "purchase"
  | "redeem"
  | "accept/decline"
  | "update";

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
    category: ["create"],
  },
  localprovider: {
    event: ["read", "create", "edit", "accept/decline"],
    ticket: ["redeem"],
    place: ["create", "accept/decline", "edit"],
    staff: ["create", "delete"],
    category: ["update"],
  },
  master: {
    localprovider: ["create", "delete"],
    event: ["read", "create", "edit", "accept/decline"],
    ticket: ["redeem"],
    place: ["create", "accept/decline", "edit"],
    staff: ["create", "delete"],
    category: ["update"],
  },
};

export type Permissions = `${Resource}:${Action}`;

export type View =
  | "manage-places"
  | "manage-staff"
  | "manage-localproviders"
  | "manage-verifiedshamans"
  | "manage-verification-stats";

export const RBAC_VIEWS: Record<Role, View[]> = {
  customer: [],
  creator: [],
  staff: [],
  verifiedshaman: [],
  localprovider: ["manage-places", "manage-staff", "manage-verifiedshamans"],
  master: [
    "manage-places",
    "manage-staff",
    "manage-localproviders",
    "manage-verifiedshamans",
    "manage-verification-stats",
  ],
};

// Role priority for determining the primary role (higher = more important)
const ROLE_PRIORITY: Record<Role, number> = {
  master: 100,
  localprovider: 80,
  verifiedshaman: 60,
  staff: 40,
  creator: 40,
  customer: 0,
};

/**
 * Get the highest priority role from a list of roles.
 * Returns null if the list is empty.
 */
export function getPrimaryRole(roles: Role[] | undefined): Role | null {
  if (!roles || roles.length === 0) {
    return null;
  }
  return roles.reduce((highest, current) => {
    const currentPriority = ROLE_PRIORITY[current] ?? -1;
    const highestPriority = ROLE_PRIORITY[highest] ?? -1;
    if (currentPriority > highestPriority) {
      return current;
    }
    return highest;
  });
}

/**
 * Check if any of the user's roles grant access to the specified view.
 */
export function checkView(roles: Role[] | undefined, view: View): boolean {
  if (!roles || roles.length === 0) {
    return false;
  }
  return roles.some((role) => {
    const views = RBAC_VIEWS[role as Role];
    if (!views) return false;
    return views.includes(view);
  });
}

/**
 * Check if any of the user's roles have all the specified permissions.
 * Uses OR logic across roles - if ANY role has the permission, access is granted.
 */
export function checkPermission(
  roles: Role[] | undefined,
  ...permissions: Permissions[]
) {
  if (!roles || roles.length === 0) {
    return false;
  }

  for (const permission of permissions) {
    const [source, action] = permission.split(":") as [Resource, Action];

    // Check if ANY role has this permission
    const hasPermission = roles.some((role) => {
      const rolePermissions = RBAC_ROLES[role as Role];
      if (!rolePermissions) return false;

      const permittedActions = rolePermissions[source];
      if (!permittedActions) return false;

      return permittedActions.includes(action);
    });

    if (!hasPermission) {
      return false;
    }
  }
  return true;
}

/**
 * Check if user has a specific role.
 */
export function hasRole(roles: Role[] | undefined, role: Role): boolean {
  if (!roles || roles.length === 0) {
    return false;
  }
  return roles.includes(role);
}

/**
 * Check if user has any of the specified roles.
 */
export function hasAnyRole(
  roles: Role[] | undefined,
  ...targetRoles: Role[]
): boolean {
  if (!roles || roles.length === 0) {
    return false;
  }
  return targetRoles.some((targetRole) => roles.includes(targetRole));
}
