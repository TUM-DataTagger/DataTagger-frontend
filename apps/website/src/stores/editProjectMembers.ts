import { enableArrayMethods, enableMapSet } from 'immer';
import { atomWithImmer } from 'jotai-immer';
import { selectAtom } from 'jotai/utils';
import {
	createProjectMembersWithAdminAtom,
	createProjectMembersWithoutAdminAtom,
	type ExtendedPermissions,
	type ProjectPermission,
} from '@/stores/memberFilters';

enableMapSet();
enableArrayMethods();

type InitialState = {
	project: {
		extendedMemberPermissions: Record<string, ExtendedPermissions>;
		memberPermission: Record<string, ProjectPermission | undefined>;
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

export const projectMembersWithAdminAtom = createProjectMembersWithAdminAtom(
	projectMembersAtom,
	projectMemberPermissionAtom,
);

export const projectMembersWithoutAdminAtom = createProjectMembersWithoutAdminAtom(
	projectMembersAtom,
	projectMemberPermissionAtom,
);
