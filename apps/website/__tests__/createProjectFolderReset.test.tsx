// @vitest-environment happy-dom

import { render, waitFor } from '@testing-library/react';
import { Provider, createStore } from 'jotai';
import { describe, expect, it } from 'vitest';
import { ResetCreateProjectFolderStateOnMount } from '@/app/(create)/projects/[projectUuid]/folders/create/ResetCreateProjectFolderStateOnMount';
import { createInitialState, projectAtom, resetCreateProjectFolderStateAtom } from '@/stores/createProjectFolder';

function setDirtyProjectFolderCreateState(store: ReturnType<typeof createStore>) {
	store.set(projectAtom, (draft) => {
		draft.project.name = 'test project';
		draft.project.members.add('member@example.com');
		draft.project.memberPermission['member@example.com'] = 'member';
		draft.folder.name = 'test folder';
		draft.folder.storage = 'dss';
		draft.folder.members.add('member@example.com');
		draft.folder.memberPermission['member@example.com'] = 'viewer';
	});
}

describe('createProjectFolder state reset', () => {
	it('resetCreateProjectFolderStateAtom restores project atom', () => {
		const store = createStore();
		setDirtyProjectFolderCreateState(store);

		store.set(resetCreateProjectFolderStateAtom);

		expect(store.get(projectAtom)).toEqual(createInitialState());
	});

	it('ResetCreateProjectFolderStateOnMount resets on mount and unmount', async () => {
		const store = createStore();
		setDirtyProjectFolderCreateState(store);

		const { unmount } = render(
			<Provider store={store}>
				<ResetCreateProjectFolderStateOnMount />
			</Provider>,
		);

		await waitFor(() => {
			expect(store.get(projectAtom)).toEqual(createInitialState());
		});

		setDirtyProjectFolderCreateState(store);
		unmount();

		expect(store.get(projectAtom)).toEqual(createInitialState());
	});
});
