import { type Atom, atom } from 'jotai';

/**
 * Shared types and atom factories for member permission filtering
 *
 * These are used across createProject, editProjectFolderPermissions, and editProjectMembers stores
 * to avoid code duplication.
 */

/**
 * Permission levels for project members
 */
type ProjectPermission = 'admin' | 'member';

/**
 * Permission levels for folder access
 */
type FolderPermission = 'admin' | 'editor' | 'viewer';

/**
 * Extended permissions for project members (e.g., ability to create folders/templates)
 */
type ExtendedPermissions = Record<string, boolean>;

/**
 * Basic member entry with id and name
 */
type MemberEntry = {
	readonly id: string;
	readonly name: string;
};

/**
 * Member entry with project permission level
 */
type MemberWithProjectPermission = MemberEntry & {
	readonly projectPermission: ProjectPermission;
};

/**
 * Member entry with folder permission level
 */
type MemberWithFolderPermission = MemberEntry & {
	readonly folderPermission: FolderPermission;
};

/**
 * Member entry with full permission details
 */
type MemberWithFullPermissions = MemberEntry & {
	readonly folderPermission: FolderPermission;
	readonly projectExtendedPermissions: ExtendedPermissions;
	readonly projectPermission: ProjectPermission;
};

/**
 * Creates a derived atom that filters members to only those with admin permission
 */
export function createProjectMembersWithAdminAtom(
	membersAtom: Atom<Set<string>>,
	permissionsAtom: Atom<Record<string, ProjectPermission | undefined>>,
): Atom<MemberEntry[]> {
	return atom((get) => {
		const members = get(membersAtom);
		const permissions = get(permissionsAtom);
		const admins: MemberEntry[] = [];

		for (const member of members) {
			if (permissions[member] === 'admin') {
				admins.push({ id: member, name: member });
			}
		}

		return admins;
	});
}

/**
 * Creates a derived atom that filters members to only those without admin permission
 */
export function createProjectMembersWithoutAdminAtom(
	membersAtom: Atom<Set<string>>,
	permissionsAtom: Atom<Record<string, ProjectPermission | undefined>>,
): Atom<MemberEntry[]> {
	return atom((get) => {
		const members = get(membersAtom);
		const permissions = get(permissionsAtom);
		const nonAdmins: MemberEntry[] = [];

		for (const member of members) {
			if (permissions[member] !== 'admin') {
				nonAdmins.push({ id: member, name: member });
			}
		}

		return nonAdmins;
	});
}

/**
 * Creates a derived atom that filters folder members to only those who are not project admins
 */
export function createFolderMembersWithoutProjectAdminAtom(
	folderMembersAtom: Atom<Set<string>>,
	projectPermissionsAtom: Atom<Record<string, ProjectPermission | undefined>>,
): Atom<MemberEntry[]> {
	return atom((get) => {
		const folderMembers = get(folderMembersAtom);
		const projectPermissions = get(projectPermissionsAtom);
		const nonAdmins: MemberEntry[] = [];

		for (const member of folderMembers) {
			if (projectPermissions[member] !== 'admin') {
				nonAdmins.push({ id: member, name: member });
			}
		}

		return nonAdmins;
	});
}

/**
 * Creates a derived atom that returns project members not in a folder (excluding admins)
 * Used for member selection when adding members to a folder
 */
export function createFolderMembersSelectionAtom(
	projectMembersAtom: Atom<Set<string>>,
	projectPermissionsAtom: Atom<Record<string, ProjectPermission | undefined>>,
	folderMembersAtom: Atom<Set<string>>,
): Atom<MemberEntry[]> {
	return atom((get) => {
		const projectMembers = get(projectMembersAtom);
		const projectPermissions = get(projectPermissionsAtom);
		const folderMembers = get(folderMembersAtom);
		const selection: MemberEntry[] = [];

		for (const member of projectMembers) {
			if (!folderMembers.has(member) && projectPermissions[member] !== 'admin') {
				selection.push({ id: member, name: member });
			}
		}

		return selection;
	});
}

/**
 * Creates a derived atom that returns folder members with their folder permissions
 */
export function createFolderMembersWithPermissionsAtom(
	folderMembersAtom: Atom<Set<string>>,
	folderPermissionsAtom: Atom<Record<string, FolderPermission | undefined>>,
): Atom<MemberWithFolderPermission[]> {
	return atom((get) => {
		const folderMembers = get(folderMembersAtom);
		const folderPermissions = get(folderPermissionsAtom);
		const membersWithPermissions: MemberWithFolderPermission[] = [];

		for (const member of folderMembers) {
			membersWithPermissions.push({
				id: member,
				name: member,
				folderPermission: folderPermissions[member] ?? 'viewer',
			});
		}

		return membersWithPermissions;
	});
}

/**
 * Creates a derived atom that returns project members with all their permission levels
 */
export function createProjectMembersWithFullPermissionsAtom(
	projectMembersAtom: Atom<Set<string>>,
	projectPermissionsAtom: Atom<Record<string, ProjectPermission | undefined>>,
	extendedPermissionsAtom: Atom<Record<string, ExtendedPermissions>>,
	folderPermissionsAtom: Atom<Record<string, FolderPermission | undefined>>,
): Atom<MemberWithFullPermissions[]> {
	return atom((get) => {
		const projectMembers = get(projectMembersAtom);
		const projectPermissions = get(projectPermissionsAtom);
		const extendedPermissions = get(extendedPermissionsAtom);
		const folderPermissions = get(folderPermissionsAtom);
		const membersWithPermissions: MemberWithFullPermissions[] = [];

		for (const member of projectMembers) {
			membersWithPermissions.push({
				id: member,
				name: member,
				projectPermission: projectPermissions[member] ?? 'member',
				projectExtendedPermissions: extendedPermissions[member] ?? {},
				folderPermission: folderPermissions[member] ?? 'viewer',
			});
		}

		return membersWithPermissions;
	});
}

export type {
	ExtendedPermissions,
	FolderPermission,
	MemberEntry,
	MemberWithFolderPermission,
	MemberWithFullPermissions,
	MemberWithProjectPermission,
	ProjectPermission,
};
