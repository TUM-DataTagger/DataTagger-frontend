import { enableMapSet } from 'immer';
import { atom } from 'jotai';
import { selectAtom } from 'jotai/utils';
import { atomWithImmer } from 'jotai-immer';

enableMapSet();

type InitialState = {
	folder: {
		memberPermission: Record<string, any>;
		members: Set<string>;
		metadata: any[];
		name: string;
		storage: string;
	};
	project: {
		extendedMemberPermissions: Record<string, Record<string, boolean>>;
		memberPermission: Record<string, any>;
		members: Set<string>;
		name: string;
	};
};

export const initialState: InitialState = {
	folder: { name: '', storage: '', metadata: [], members: new Set(), memberPermission: {} },
	project: { name: '', members: new Set(), memberPermission: {}, extendedMemberPermissions: {} },
};

export const stepAtom = atom(0);

export const projectAtom = atomWithImmer<InitialState>(initialState);

export const projectMembersAtom = selectAtom(projectAtom, (project) => project.project.members);

export const projectMemberPermissionAtom = selectAtom(projectAtom, (project) => project.project.memberPermission);

export const projectExtendedMemberPermissionsAtom = selectAtom(
	projectAtom,
	(project) => project.project.extendedMemberPermissions,
);

export const projectMembersWithAdminAtom = atom((get) => {
	const projectMembers = get(projectMembersAtom);
	const projectMemberPermission = get(projectMemberPermissionAtom);
	const projectMembersWithoutAdmin: { id: string; name: string }[] = [];
	for (const member of projectMembers) {
		if (projectMemberPermission[member] === 'admin') {
			projectMembersWithoutAdmin.push({ id: member, name: member });
		}
	}

	return projectMembersWithoutAdmin;
});

export const projectMembersWithoutAdminAtom = atom((get) => {
	const projectMembers = get(projectMembersAtom);
	const projectMemberPermission = get(projectMemberPermissionAtom);
	const projectMembersWithoutAdmin: { id: string; name: string }[] = [];
	for (const member of projectMembers) {
		if (projectMemberPermission[member] !== 'admin') {
			projectMembersWithoutAdmin.push({ id: member, name: member });
		}
	}

	return projectMembersWithoutAdmin;
});

export const folderMembersAtom = selectAtom(projectAtom, (project) => project.folder.members);

export const folderMembersWithoutProjectAdminAtom = atom((get) => {
	const projectMemberPermission = get(projectMemberPermissionAtom);
	const folderMembers = get(folderMembersAtom);
	const folderMembersWithoutProjectAdmin: { id: string; name: string }[] = [];
	for (const member of folderMembers) {
		if (projectMemberPermission[member] !== 'admin') {
			folderMembersWithoutProjectAdmin.push({ id: member, name: member });
		}
	}

	return folderMembersWithoutProjectAdmin;
});

export const folderMembersSelectionAtom = atom((get) => {
	const projectMembers = get(projectMembersAtom);
	const projectMemberPermission = get(projectMemberPermissionAtom);
	const folderMembers = get(folderMembersAtom);
	const folderMembersSelection: { id: string; name: string }[] = [];
	for (const member of projectMembers) {
		if (!folderMembers.has(member) && projectMemberPermission[member] !== 'admin') {
			folderMembersSelection.push({ id: member, name: member });
		}
	}

	return folderMembersSelection;
});

export const folderMemberPermissionAtom = selectAtom(projectAtom, (project) => project.folder.memberPermission);

export const projectMembersWithPermissionsAndFolderPermissionsAtom = atom((get) => {
	const projectMembers = get(projectMembersAtom);
	const projectMemberPermission = get(projectMemberPermissionAtom);
	const projectExtendedMemberPermissions = get(projectExtendedMemberPermissionsAtom);
	const folderMemberPermission = get(folderMemberPermissionAtom);
	const projectMembersWithPermissionsAndFolderPermissions: {
		folderPermission: 'admin' | 'editor' | 'viewer';
		id: string;
		name: string;
		projectExtendedPermissions: Record<'folders', boolean>;
		projectPermission: 'admin' | 'member';
	}[] = [];
	for (const member of projectMembers) {
		projectMembersWithPermissionsAndFolderPermissions.push({
			id: member,
			name: member,
			projectPermission: projectMemberPermission[member],
			projectExtendedPermissions: projectExtendedMemberPermissions[member] ?? {},
			folderPermission: folderMemberPermission[member],
		});
	}

	return projectMembersWithPermissionsAndFolderPermissions;
});

export const folderMembersWithFolderPermissionsAtom = atom((get) => {
	const folderMembers = get(folderMembersAtom);
	const folderMemberPermission = get(folderMemberPermissionAtom);
	const folderMembersWithFolderPermissions: {
		folderPermission: 'admin' | 'editor' | 'viewer';
		id: string;
		name: string;
	}[] = [];
	for (const member of folderMembers) {
		folderMembersWithFolderPermissions.push({
			id: member,
			name: member,
			folderPermission: folderMemberPermission[member],
		});
	}

	return folderMembersWithFolderPermissions;
});
