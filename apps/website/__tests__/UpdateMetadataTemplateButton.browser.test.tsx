import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Suspense } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { UpdateMetadataTemplateButton } from '@/components/metadata-template/EditTemplateContainersToolbar';
import type * as ToastModule from '@/components/ui/Toast';

const nuqsState = vi.hoisted(() => ({
	queryStates: {
		template_bulk_edit: true,
	} as Record<string, unknown>,
	setQueryStates: vi.fn(async (_nextValue: Record<string, unknown>) => {}),
}));

const apiState = vi.hoisted(() => ({
	patchMock: vi.fn(),
}));

const toastState = vi.hoisted(() => ({
	add: vi.fn(),
}));

vi.mock('nuqs', async () => {
	const React = await import('react');

	return {
		parseAsBoolean: {
			withDefault: (defaultValue: boolean) => ({ defaultValue }),
		},
		useQueryStates: (schema: Record<string, { readonly defaultValue?: unknown }>) => {
			const initialValue = Object.fromEntries(
				Object.entries(schema).map(([key, parser]) => [key, nuqsState.queryStates[key] ?? parser.defaultValue ?? null]),
			);
			const [state, setState] = React.useState<Record<string, unknown>>(initialValue);

			return [
				state,
				async (nextValue: Record<string, unknown>) => {
					void nuqsState.setQueryStates(nextValue);
					setState((currentValue) => ({
						...currentValue,
						...nextValue,
					}));
				},
			] as const;
		},
	};
});

vi.mock('@/util/clientFetch', () => ({
	$api: {
		queryOptions: (method: string, path: string, options?: { readonly params?: unknown }) => ({
			queryKey: [method, path, options?.params ?? null],
		}),
	},
	openAPIClient: {
		PATCH: (...args: unknown[]) => apiState.patchMock(...args),
	},
}));

vi.mock('@/util/invalidateUpgradeMetadataStatusQueries', () => ({
	invalidateUpgradeMetadataStatusQueries: vi.fn(async () => {}),
}));

vi.mock('@/components/ui/Toast', async () => {
	const actual = await vi.importActual<typeof ToastModule>('@/components/ui/Toast');

	return {
		...actual,
		globalToastQueue: {
			add: toastState.add,
		},
	};
});

function createQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});
}

const folderResource = {
	metadata_template: {
		pk: 'template-current',
		metadata_template_container: { pk: 'container-1' },
	},
};

const containers = [
	{
		pk: 'container-1',
		latest_metadata_template: { pk: 'template-latest' },
	},
];

describe('UpdateMetadataTemplateButton', () => {
	beforeEach(() => {
		apiState.patchMock.mockReset();
		toastState.add.mockReset();
		nuqsState.queryStates = { template_bulk_edit: true };
		nuqsState.setQueryStates.mockClear();
	});

	it('exits template bulk mode and shows the existing success toast after a successful update', async () => {
		apiState.patchMock.mockResolvedValueOnce({
			data: null,
			error: null,
			response: new Response(null, { status: 200 }),
		});

		const queryClient = createQueryClient();
		queryClient.setQueryData(['get', '/api/v1/folder/{id}/', { path: { id: 'folder-1' } }], folderResource);

		const screen = await render(
			<QueryClientProvider client={queryClient}>
				<Suspense fallback={null}>
					<UpdateMetadataTemplateButton
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						containers={containers as any}
						folderUuid="folder-1"
						projectUuid="project-1"
					/>
				</Suspense>
			</QueryClientProvider>,
		);

		await screen.getByRole('button', { name: 'Update to latest version' }).click();

		await vi.waitFor(() => {
			expect(nuqsState.setQueryStates).toHaveBeenCalledWith({ template_bulk_edit: false });
		});

		expect(toastState.add).toHaveBeenCalledWith(
			expect.objectContaining({
				message: 'Metadata template updated to the latest version.',
			}),
			expect.anything(),
		);
	});
});
