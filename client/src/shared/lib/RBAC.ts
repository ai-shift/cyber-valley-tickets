export type Role = "MASTER" | "STAFF" | "CREATOR" | "USER";

export type RoleControl = {
	[key in Role]: {
		views: PagePermission[];
		actions: ResourcePermission[];
	};
};

export type PermissionCategory = keyof RoleControl[Role];
type Page = "HOME" | "ACCOUNT";
type Resource = "EVENT";
type Method = "GET" | "ADD" | "EDIT" | "REMOVE";

export type PagePermission = `${Page}:VIEW`;
export type ResourcePermission = `${Resource}:${Method}`;

export const RBAC_ROLES: RoleControl = {
	USER: {
		views: ["HOME:VIEW", "ACCOUNT:VIEW"],
		actions: ["EVENT:GET"],
	},
	CREATOR: {
		views: ["HOME:VIEW", "ACCOUNT:VIEW"],
		actions: ["EVENT:GET"],
	},
	MASTER: {
		views: ["HOME:VIEW", "ACCOUNT:VIEW"],
		actions: ["EVENT:GET"],
	},
	STAFF: {
		views: ["HOME:VIEW", "ACCOUNT:VIEW"],
		actions: ["EVENT:GET"],
	},
};

export function checkPermission<T extends PermissionCategory>(
	role: Role,
	permissionType: T,
	permission: T extends "views" ? PagePermission : ResourcePermission,
): boolean {
	return (
		RBAC_ROLES[role][permissionType] as (PagePermission | ResourcePermission)[]
	).includes(permission);
}
