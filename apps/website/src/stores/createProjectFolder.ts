import { atom } from 'jotai';
import { createProjectFolderAtoms } from './projectFolderAtomFactory';

const atoms = createProjectFolderAtoms();

export const {
	createInitialState,
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
} = atoms;

export const resetCreateProjectFolderStateAtom = atom(null, (_get, set) => {
	set(projectAtom, createInitialState());
});
