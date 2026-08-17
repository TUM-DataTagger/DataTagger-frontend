// @vitest-environment happy-dom

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type MetadataKeyScope, useResolvedScope } from '@/util/filterContext';

const apiState = vi.hoisted(() => ({
	getMock: vi.fn(),
}));

vi.mock('@/util/clientFetch', async () => {
	const { default: createReactQueryClient } = await import('openapi-react-query');
	const openAPIClient = {
		GET: (...args: unknown[]) => apiState.getMock(...args),
	};
	return {
		openAPIClient,
		$api: createReactQueryClient(openAPIClient as never),
	};
});

function wrapper({ children }: { readonly children: ReactNode }) {
	const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const emptyScope: MetadataKeyScope = {
	projectIds: [],
	folderIds: [],
	datasetIds: [],
	templateIds: [],
	projectNames: [],
	folderNames: [],
	datasetNames: [],
	templateNames: [],
};

function okResponse<TData>(data: TData) {
	return { data, error: null, response: new Response(null, { status: 200 }) };
}

describe('useResolvedScope', () => {
	beforeEach(() => {
		apiState.getMock.mockReset();
	});

	it('returns empty resolved scope when no scope is provided', () => {
		const { result } = renderHook(() => useResolvedScope(undefined), { wrapper });
		expect(result.current).toEqual({ projectIds: [], folderIds: [], datasetIds: [], templateIds: [] });
	});

	it('passes through id-typed scope without firing name lookups', () => {
		const { result } = renderHook(() => useResolvedScope({ ...emptyScope, projectIds: ['p-1'] }), { wrapper });
		expect(result.current.projectIds).toEqual(['p-1']);
		expect(apiState.getMock).not.toHaveBeenCalled();
	});

	it('resolves a project name to its pk via the search endpoint', async () => {
		apiState.getMock.mockResolvedValue(okResponse({ results: [{ name: 'Alpha', pk: 'p-1' }] }));

		const { result } = renderHook(() => useResolvedScope({ ...emptyScope, projectNames: ['Alpha'] }), {
			wrapper,
		});

		await waitFor(() => {
			expect(result.current.projectIds).toEqual(['p-1']);
		});
		expect(apiState.getMock).toHaveBeenCalledWith('/api/v1/project/', expect.objectContaining({}));
	});

	it('drops a name when no matching entity is returned', async () => {
		apiState.getMock.mockResolvedValue(okResponse({ results: [{ name: 'Beta', pk: 'p-2' }] }));

		const { result } = renderHook(() => useResolvedScope({ ...emptyScope, folderNames: ['Alpha'] }), {
			wrapper,
		});

		await waitFor(() => {
			expect(apiState.getMock).toHaveBeenCalled();
		});
		expect(result.current.folderIds).toEqual([]);
	});

	it('merges id-typed and name-typed scope entries for the same kind', async () => {
		apiState.getMock.mockResolvedValue(okResponse({ results: [{ name: 'Alpha', pk: 'p-1' }] }));

		const { result } = renderHook(
			() => useResolvedScope({ ...emptyScope, projectIds: ['p-99'], projectNames: ['Alpha'] }),
			{ wrapper },
		);

		await waitFor(() => {
			expect(result.current.projectIds).toEqual(['p-99', 'p-1']);
		});
	});

	it('resolves a template name to its pk via the metadata-template-container endpoint', async () => {
		apiState.getMock.mockResolvedValue(okResponse({ results: [{ name: 'Compliance', pk: 'tpl-1' }] }));

		const { result } = renderHook(() => useResolvedScope({ ...emptyScope, templateNames: ['Compliance'] }), {
			wrapper,
		});

		await waitFor(() => {
			expect(result.current.templateIds).toEqual(['tpl-1']);
		});
		expect(apiState.getMock).toHaveBeenCalledWith('/api/v1/metadata-template-container/', expect.objectContaining({}));
	});

	it('returns every matching pk when multiple entities share the queried name', async () => {
		apiState.getMock.mockResolvedValue(
			okResponse({
				results: [
					{ name: 'Alpha', pk: 'p-1' },
					{ name: 'Alpha', pk: 'p-2' },
					{ name: 'Beta', pk: 'p-3' },
				],
			}),
		);

		const { result } = renderHook(() => useResolvedScope({ ...emptyScope, projectNames: ['Alpha'] }), {
			wrapper,
		});

		await waitFor(() => {
			expect([...result.current.projectIds].sort((a, b) => a.localeCompare(b))).toEqual(['p-1', 'p-2']);
		});
	});
});
