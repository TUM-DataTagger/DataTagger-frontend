import { createProjectFolderAtoms } from './projectFolderAtomFactory';

const atoms = createProjectFolderAtoms();

export const {
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
} = atoms;
