import { enableArrayMethods, enableMapSet } from 'immer';
import { atom } from 'jotai';
import { atomWithImmer } from 'jotai-immer';
import { selectAtom } from 'jotai/utils';
import {
	createFolderMembersSelectionAtom,
	createFolderMembersWithoutProjectAdminAtom,
	createFolderMembersWithPermissionsAtom,
	createProjectMembersWithAdminAtom,
	createProjectMembersWithFullPermissionsAtom,
	createProjectMembersWithoutAdminAtom,
	type ExtendedPermissions,
	type FolderPermission,
	type ProjectPermission,
} from '@/stores/memberFilters';

enableMapSet();
enableArrayMethods();

type FolderMetadataEntry = {
	readonly name: string;
	readonly pk: number;
	readonly value?: string;
};

type ProjectFolderState = {
	folder: {
		memberPermission: Record<string, FolderPermission | undefined>;
		members: Set<string>;
		metadata: FolderMetadataEntry[];
		name: string;
		storage: string;
	};
	project: {
		extendedMemberPermissions: Record<string, ExtendedPermissions>;
		memberPermission: Record<string, ProjectPermission | undefined>;
		members: Set<string>;
		name: string;
	};
};

const createInitialState = (): ProjectFolderState => ({
	folder: { name: '', storage: '', metadata: [], members: new Set(), memberPermission: {} },
	project: { name: '', members: new Set(), memberPermission: {}, extendedMemberPermissions: {} },
});

/**
 * Factory function to create project/folder permission atoms.
 * Used by both createProject and editProjectFolderPermissions stores.
 *
 * Each call creates independent atom instances with their own state,
 * allowing multiple contexts (create vs edit) to coexist without interference.
 */
export function createProjectFolderAtoms() {
	const initialState = createInitialState();
	const stepAtom = atom(0);
	const projectAtom = atomWithImmer<ProjectFolderState>(initialState);

	// Project-level derived atoms
	const projectMembersAtom = selectAtom(projectAtom, (state) => state.project.members);
	const projectMemberPermissionAtom = selectAtom(projectAtom, (state) => state.project.memberPermission);
	const projectExtendedMemberPermissionsAtom = selectAtom(
		projectAtom,
		(state) => state.project.extendedMemberPermissions,
	);

	const projectMembersWithAdminAtom = createProjectMembersWithAdminAtom(
		projectMembersAtom,
		projectMemberPermissionAtom,
	);

	const projectMembersWithoutAdminAtom = createProjectMembersWithoutAdminAtom(
		projectMembersAtom,
		projectMemberPermissionAtom,
	);

	// Folder-level derived atoms
	const folderMembersAtom = selectAtom(projectAtom, (state) => state.folder.members);
	const folderMemberPermissionAtom = selectAtom(projectAtom, (state) => state.folder.memberPermission);

	const folderMembersWithoutProjectAdminAtom = createFolderMembersWithoutProjectAdminAtom(
		folderMembersAtom,
		projectMemberPermissionAtom,
	);

	const folderMembersSelectionAtom = createFolderMembersSelectionAtom(
		projectMembersAtom,
		projectMemberPermissionAtom,
		folderMembersAtom,
	);

	// Combined permission atoms
	const projectMembersWithPermissionsAndFolderPermissionsAtom = createProjectMembersWithFullPermissionsAtom(
		projectMembersAtom,
		projectMemberPermissionAtom,
		projectExtendedMemberPermissionsAtom,
		folderMemberPermissionAtom,
	);

	const folderMembersWithFolderPermissionsAtom = createFolderMembersWithPermissionsAtom(
		folderMembersAtom,
		folderMemberPermissionAtom,
	);

	return {
		createInitialState,
		stepAtom,
		projectAtom,
		projectMembersAtom,
		projectMemberPermissionAtom,
		projectExtendedMemberPermissionsAtom,
		projectMembersWithAdminAtom,
		projectMembersWithoutAdminAtom,
		folderMembersAtom,
		folderMemberPermissionAtom,
		folderMembersWithoutProjectAdminAtom,
		folderMembersSelectionAtom,
		projectMembersWithPermissionsAndFolderPermissionsAtom,
		folderMembersWithFolderPermissionsAtom,
	};
}

export type { FolderMetadataEntry, ProjectFolderState };
