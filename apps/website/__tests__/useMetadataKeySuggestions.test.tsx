// @vitest-environment happy-dom

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMetadataKeySuggestions } from '@/app/(main)/search/useMetadataKeySuggestions';
import { type MetadataKeyScope } from '@/util/filterContext';

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

const projectScope: MetadataKeyScope = { ...emptyScope, projectIds: ['p-1'] };

describe('useMetadataKeySuggestions — return shape', () => {
	beforeEach(() => {
		apiState.getMock.mockReset();
	});

	it('returns empty groups and empty idToKey when scope is undefined', () => {
		const { result } = renderHook(() => useMetadataKeySuggestions(undefined), { wrapper });
		expect(result.current.groups).toEqual([]);
		expect(result.current.idToKey.size).toBe(0);
	});

	it('returns groups keyed by source with human-readable sourceLabel', async () => {
		apiState.getMock.mockResolvedValue(
			okResponse({
				results: [
					{ key: 'price', field_type: 'INTEGER', source: 'project', is_linked: false },
					{ key: 'author', field_type: 'TEXT', source: 'project', is_linked: false },
				],
			}),
		);

		const { result } = renderHook(() => useMetadataKeySuggestions(projectScope), { wrapper });

		await waitFor(() => {
			expect(result.current.groups).toHaveLength(1);
		});
		const [group] = result.current.groups;
		expect(group?.source).toBe('project');
		expect(group?.sourceLabel).toBe('Project');
		expect(group?.keys.map((entry) => entry.suggestion.key)).toEqual(['price', 'author']);
	});

	it('lands the same key under two groups when it appears under two sources', async () => {
		apiState.getMock.mockResolvedValue(
			okResponse({
				results: [
					{ key: 'price', field_type: 'INTEGER', source: 'project', is_linked: false },
					{ key: 'price', field_type: 'INTEGER', source: 'folder', is_linked: false },
				],
			}),
		);

		const { result } = renderHook(() => useMetadataKeySuggestions(projectScope), { wrapper });

		await waitFor(() => {
			expect(result.current.groups).toHaveLength(2);
		});
		const sources = result.current.groups.map((group) => group.source);
		expect(sources).toEqual(['project', 'folder']);
	});

	it('preserves first-encounter order across groups', async () => {
		apiState.getMock.mockResolvedValue(
			okResponse({
				results: [
					{ key: 'a', field_type: 'TEXT', source: 'folder', is_linked: false },
					{ key: 'b', field_type: 'TEXT', source: 'project', is_linked: false },
					{ key: 'c', field_type: 'TEXT', source: 'folder', is_linked: false },
				],
			}),
		);

		const { result } = renderHook(() => useMetadataKeySuggestions(projectScope), { wrapper });

		await waitFor(() => {
			expect(result.current.groups).toHaveLength(2);
		});
		const sources = result.current.groups.map((group) => group.source);
		expect(sources).toEqual(['folder', 'project']);
	});

	it('labels a template-sourced group as "Template"', async () => {
		apiState.getMock.mockResolvedValue(
			okResponse({
				results: [{ key: 'country', field_type: 'TEXT', source: 'template', is_linked: false }],
			}),
		);

		const templateScope: MetadataKeyScope = { ...emptyScope, templateIds: ['tpl-1'] };
		const { result } = renderHook(() => useMetadataKeySuggestions(templateScope), { wrapper });

		await waitFor(() => {
			expect(result.current.groups).toHaveLength(1);
		});
		const [group] = result.current.groups;
		expect(group?.source).toBe('template');
		expect(group?.sourceLabel).toBe('Template');
	});

	it('includes template_id in the metadata-keys query when scope carries templateIds', async () => {
		apiState.getMock.mockResolvedValue(okResponse({ results: [] }));

		const templateScope: MetadataKeyScope = { ...emptyScope, templateIds: ['tpl-1', 'tpl-2'] };
		renderHook(() => useMetadataKeySuggestions(templateScope), { wrapper });

		await waitFor(() => {
			expect(apiState.getMock).toHaveBeenCalled();
		});
		const [, options] = apiState.getMock.mock.calls.at(-1) ?? [];
		expect(options?.params?.query?.template_id).toEqual(['tpl-1', 'tpl-2']);
	});

	it('is enabled by a template-only scope (no entity ids needed)', async () => {
		apiState.getMock.mockResolvedValue(
			okResponse({
				results: [{ key: 'country', field_type: 'TEXT', source: 'template', is_linked: false }],
			}),
		);

		const templateScope: MetadataKeyScope = { ...emptyScope, templateIds: ['tpl-1'] };
		const { result } = renderHook(() => useMetadataKeySuggestions(templateScope), { wrapper });

		await waitFor(() => {
			expect(result.current.idToKey.size).toBe(1);
		});
	});

	it('lands the same key under template and project groups when both sources return it', async () => {
		apiState.getMock.mockResolvedValue(
			okResponse({
				results: [
					{ key: 'country', field_type: 'TEXT', source: 'template', is_linked: false },
					{ key: 'country', field_type: 'TEXT', source: 'project', is_linked: false },
				],
			}),
		);

		const combinedScope: MetadataKeyScope = { ...emptyScope, projectIds: ['p-1'], templateIds: ['tpl-1'] };
		const { result } = renderHook(() => useMetadataKeySuggestions(combinedScope), { wrapper });

		await waitFor(() => {
			expect(result.current.groups).toHaveLength(2);
		});
		const sources = result.current.groups.map((group) => group.source);
		expect(sources).toEqual(['template', 'project']);
		expect(result.current.idToKey.size).toBe(2);
	});

	it('assigns a unique id to every key entry and maps it back to the key string', async () => {
		apiState.getMock.mockResolvedValue(
			okResponse({
				results: [
					{ key: 'price', field_type: 'INTEGER', source: 'project', is_linked: false },
					{ key: 'price', field_type: 'INTEGER', source: 'folder', is_linked: false },
				],
			}),
		);

		const { result } = renderHook(() => useMetadataKeySuggestions(projectScope), { wrapper });

		await waitFor(() => {
			expect(result.current.idToKey.size).toBe(2);
		});
		for (const group of result.current.groups) {
			for (const { id, suggestion } of group.keys) {
				expect(result.current.idToKey.get(id)).toBe(suggestion.key);
			}
		}
		const allIds = result.current.groups.flatMap((group) => group.keys.map((entry) => entry.id));
		expect(new Set(allIds).size).toBe(allIds.length);
	});
});
