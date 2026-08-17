import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider, createStore } from 'jotai';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { ProjectCreateStepTwoForm } from '@/app/(create)/projects/create/2/ProjectCreateStepTwoForm';
import { projectAtom, stepAtom } from '@/stores/createProject';

const mocks = vi.hoisted(() => ({
	markCompleted: vi.fn(),
	post: vi.fn(),
	push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
	useRouter: () => ({
		push: mocks.push,
	}),
}));

vi.mock('@/hooks/useCurrentUser', () => ({
	useCurrentUser: () => ({
		currentUserData: null,
	}),
}));

vi.mock('@/hooks/useFirstTimeFlag', () => ({
	useFirstTimeFlag: () => ({
		isFirstTime: true,
		markCompleted: mocks.markCompleted,
		reset: vi.fn(),
	}),
}));

vi.mock('@/util/clientFetch', () => ({
	$api: {
		queryOptions: (...args: unknown[]) => ({
			queryKey: args,
		}),
	},
	openAPIClient: {
		POST: mocks.post,
	},
}));

describe('project create step two browser smoke', () => {
	beforeEach(() => {
		mocks.push.mockReset();
		mocks.markCompleted.mockReset();
		mocks.post.mockReset();
		mocks.post.mockResolvedValue({
			data: { pk: 'project-uuid' },
			error: null,
			response: new Response(null, { status: 201 }),
		});
	});

	it('submits through footer button and navigates to new project on success', async () => {
		const store = createStore();
		store.set(stepAtom, 1);
		store.set(projectAtom, (draft) => {
			draft.project.name = 'Test project';
			draft.folder.name = 'Test folder';
		});

		const queryClient = new QueryClient({
			defaultOptions: {
				queries: {
					retry: false,
				},
				mutations: {
					retry: false,
				},
			},
		});

		const screen = await render(
			<QueryClientProvider client={queryClient}>
				<Provider store={store}>
					<ProjectCreateStepTwoForm />
					<button form="project-create" type="submit">
						Save & complete
					</button>
				</Provider>
			</QueryClientProvider>,
		);

		await screen.getByRole('button', { name: 'Save & complete' }).click();

		await vi.waitFor(() => {
			expect(mocks.post).toHaveBeenCalledWith(
				'/api/v1/project/',
				expect.objectContaining({
					body: expect.objectContaining({
						folder_name: 'Test folder',
						name: 'Test project',
					}),
				}),
			);
			expect(mocks.push).toHaveBeenCalledWith('/projects/project-uuid');
		});

		expect(mocks.markCompleted).toHaveBeenCalledTimes(1);
		// State reset is handled by ResetCreateProjectStateOnMount (layout unmount),
		// not by the onSuccess handler, to avoid a race with the step guard useEffect.
	});
});
