import { enableMapSet } from 'immer';
import { atom } from 'jotai';
import { selectAtom } from 'jotai/utils';
import { atomWithImmer } from 'jotai-immer';

enableMapSet();

type InitialState = {
	project: {
		extendedMemberPermissions: Record<string, Record<string, boolean>>;
		memberPermission: Record<string, any>;
		members: Set<string>;
		name: string;
	};
};

export const initialState: InitialState = {
	project: { name: '', members: new Set(), memberPermission: {}, extendedMemberPermissions: {} },
};

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
	const projectMembersWithAdmin: { id: string; name: string }[] = [];
	for (const member of projectMembers) {
		if (projectMemberPermission[member] === 'admin') {
			projectMembersWithAdmin.push({ id: member, name: member });
		}
	}

	return projectMembersWithAdmin;
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
