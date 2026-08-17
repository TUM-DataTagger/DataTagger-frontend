// @vitest-environment happy-dom

import { render, waitFor } from '@testing-library/react';
import { Provider, createStore } from 'jotai';
import { describe, expect, it } from 'vitest';
import { ResetCreateProjectStateOnMount } from '@/app/(create)/projects/create/ResetCreateProjectStateOnMount';
import { createInitialState, projectAtom, resetCreateProjectStateAtom, stepAtom } from '@/stores/createProject';

function setDirtyProjectCreateState(store: ReturnType<typeof createStore>) {
	store.set(stepAtom, 1);
	store.set(projectAtom, (draft) => {
		draft.project.name = 'test project';
		draft.project.members.add('member@example.com');
		draft.project.memberPermission['member@example.com'] = 'member';
		draft.folder.name = 'test folder';
		draft.folder.storage = 'dss';
	});
}

describe('createProject state reset', () => {
	it('resetCreateProjectStateAtom restores project atom and step atom', () => {
		const store = createStore();
		setDirtyProjectCreateState(store);

		store.set(resetCreateProjectStateAtom);

		expect(store.get(stepAtom)).toBe(0);
		expect(store.get(projectAtom)).toEqual(createInitialState());
	});

	it('ResetCreateProjectStateOnMount resets on mount and unmount', async () => {
		const store = createStore();
		setDirtyProjectCreateState(store);

		const { unmount } = render(
			<Provider store={store}>
				<ResetCreateProjectStateOnMount />
			</Provider>,
		);

		await waitFor(() => {
			expect(store.get(stepAtom)).toBe(0);
			expect(store.get(projectAtom)).toEqual(createInitialState());
		});

		setDirtyProjectCreateState(store);
		unmount();

		expect(store.get(stepAtom)).toBe(0);
		expect(store.get(projectAtom)).toEqual(createInitialState());
	});
});
