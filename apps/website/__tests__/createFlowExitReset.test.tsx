// @vitest-environment happy-dom

import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { Provider, createStore } from 'jotai';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CancelButton as ProjectFolderCreateCancelButton } from '@/app/(create)/projects/[projectUuid]/folders/create/CancelButton';
import { CloseButton as ProjectFolderCreateCloseButton } from '@/app/(create)/projects/[projectUuid]/folders/create/CloseButton';
import { CancelButton as ProjectCreateCancelButton } from '@/app/(create)/projects/create/CancelButton';
import { CloseButton as ProjectCreateCloseButton } from '@/app/(create)/projects/create/CloseButton';
import {
	createInitialState as createProjectInitialState,
	projectAtom as createProjectAtom,
	stepAtom,
} from '@/stores/createProject';
import {
	createInitialState as createProjectFolderInitialState,
	projectAtom as createProjectFolderAtom,
} from '@/stores/createProjectFolder';

const pushMock = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
	useRouter: () => ({
		push: pushMock,
	}),
}));

vi.mock('@/components/ui/Button', () => ({
	Button: ({
		children,
		onPress,
		...props
	}: {
		readonly children: ReactNode;
		readonly onPress?: (() => void | Promise<void>) | undefined;
	}) => (
		<button
			{...props}
			onClick={() => {
				void onPress?.();
			}}
			type="button"
		>
			{children}
		</button>
	),
}));

function setDirtyProjectCreateState(store: ReturnType<typeof createStore>) {
	store.set(stepAtom, 1);
	store.set(createProjectAtom, (draft) => {
		draft.project.name = 'test project';
		draft.folder.name = 'test folder';
	});
}

function setDirtyProjectFolderCreateState(store: ReturnType<typeof createStore>) {
	store.set(createProjectFolderAtom, (draft) => {
		draft.project.name = 'test project';
		draft.folder.name = 'test folder';
	});
}

describe('create flow exit reset', () => {
	beforeEach(() => {
		pushMock.mockReset();
	});

	afterEach(() => {
		cleanup();
	});

	it('project create cancel resets state and navigates to projects', async () => {
		const store = createStore();
		setDirtyProjectCreateState(store);

		const screen = render(
			<Provider store={store}>
				<ProjectCreateCancelButton />
			</Provider>,
		);

		fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

		expect(store.get(stepAtom)).toBe(0);
		expect(store.get(createProjectAtom)).toEqual(createProjectInitialState());
		await waitFor(() => {
			expect(pushMock).toHaveBeenCalledWith('/projects');
		});
	});

	it('project create close resets state and navigates to projects', async () => {
		const store = createStore();
		setDirtyProjectCreateState(store);

		const screen = render(
			<Provider store={store}>
				<ProjectCreateCloseButton />
			</Provider>,
		);

		fireEvent.click(screen.getByRole('button', { name: 'Close' }));

		expect(store.get(stepAtom)).toBe(0);
		expect(store.get(createProjectAtom)).toEqual(createProjectInitialState());
		await waitFor(() => {
			expect(pushMock).toHaveBeenCalledWith('/projects');
		});
	});

	it('project folder create cancel resets state and navigates to folders', async () => {
		const store = createStore();
		setDirtyProjectFolderCreateState(store);

		const screen = render(
			<Provider store={store}>
				<ProjectFolderCreateCancelButton />
			</Provider>,
		);

		fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

		expect(store.get(createProjectFolderAtom)).toEqual(createProjectFolderInitialState());
		await waitFor(() => {
			expect(pushMock).toHaveBeenCalledWith('../folders');
		});
	});

	it('project folder create close resets state and navigates to folders', async () => {
		const store = createStore();
		setDirtyProjectFolderCreateState(store);

		const screen = render(
			<Provider store={store}>
				<ProjectFolderCreateCloseButton />
			</Provider>,
		);

		fireEvent.click(screen.getByRole('button', { name: 'Close' }));

		expect(store.get(createProjectFolderAtom)).toEqual(createProjectFolderInitialState());
		await waitFor(() => {
			expect(pushMock).toHaveBeenCalledWith('../folders');
		});
	});
});
