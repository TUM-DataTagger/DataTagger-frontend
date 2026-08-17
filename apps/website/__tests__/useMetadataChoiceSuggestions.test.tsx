// @vitest-environment happy-dom

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMetadataChoiceSuggestions } from '@/app/(main)/search/useMetadataChoiceSuggestions';
import type { MetadataKeyScope } from '@/util/filterContext';

const apiState = vi.hoisted(() => ({ getMock: vi.fn() }));

vi.mock('@/util/clientFetch', async () => {
	const { default: createReactQueryClient } = await import('openapi-react-query');
	const openAPIClient = { GET: (...args: unknown[]) => apiState.getMock(...args) };
	return { openAPIClient, $api: createReactQueryClient(openAPIClient as never) };
});

function wrapper({ children }: { readonly children: ReactNode }) {
	return (
		<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
			{children}
		</QueryClientProvider>
	);
}

const scope: MetadataKeyScope = {
	projectIds: ['project-1'],
	folderIds: [],
	datasetIds: [],
	templateIds: ['template-1'],
	projectNames: [],
	folderNames: [],
	datasetNames: [],
	templateNames: [],
};

const group = {
	field_type: 'SELECTION' as const,
	key: 'status',
	metadata_template_field_id: 'field-1',
	metadata_template_id: 'version-1',
	metadata_template_name: 'Workflow',
	metadata_template_container_name: 'Workflow choices',
	options: ['Open', 'Closed'],
	source: 'project' as const,
	source_id: 'project-1',
	source_name: 'Project one',
};

describe('useMetadataChoiceSuggestions', () => {
	beforeEach(() => apiState.getMock.mockReset());

	it('does not fetch until the control is open with a bounded key', () => {
		const { result } = renderHook(
			() =>
				useMetadataChoiceSuggestions({
					enabled: false,
					fieldType: 'SELECTION',
					keys: ['status'],
					scope: { ...scope, projectNames: ['Named project'] },
				}),
			{ wrapper },
		);
		expect(apiState.getMock).not.toHaveBeenCalled();
		expect(result.current.groups).toEqual([]);
	});

	it('does not refetch for key changes while the control is closed', async () => {
		apiState.getMock.mockResolvedValue({ data: { results: [group] }, error: null, response: new Response(null) });
		const { rerender } = renderHook(
			(props: { enabled: boolean; keyName: string }) =>
				useMetadataChoiceSuggestions({ enabled: props.enabled, fieldType: 'SELECTION', keys: [props.keyName] }),
			{ initialProps: { enabled: true, keyName: 'status' }, wrapper },
		);

		await waitFor(() => expect(apiState.getMock).toHaveBeenCalledTimes(1));
		rerender({ enabled: false, keyName: 'priority' });
		await new Promise((resolve) => {
			setTimeout(resolve, 20);
		});

		expect(apiState.getMock).toHaveBeenCalledTimes(1);
	});

	it('requests every key, the choice type, and optional resolved scope', async () => {
		apiState.getMock.mockResolvedValue({ data: { results: [group] }, error: null, response: new Response(null) });
		const { result } = renderHook(
			() =>
				useMetadataChoiceSuggestions({
					enabled: true,
					fieldType: 'SELECTION',
					keys: ['status', 'priority'],
					scope,
				}),
			{ wrapper },
		);

		await waitFor(() => expect(result.current.groups).toHaveLength(1));
		expect(apiState.getMock).toHaveBeenCalledWith(
			'/api/v1/search/metadata-choice-options/',
			expect.objectContaining({
				params: {
					query: {
						field_type: 'SELECTION',
						key: ['status', 'priority'],
						project_id: ['project-1'],
						template_id: ['template-1'],
					},
				},
			}),
		);
	});

	it('preserves provenance groups and maps duplicate occurrences to one literal', async () => {
		apiState.getMock.mockResolvedValue({
			data: {
				results: [
					group,
					{
						...group,
						metadata_template_name: 'Other assignment',
						metadata_template_container_name: 'Other choices',
						options: ['Open'],
						source: 'template',
						source_id: 'template-2',
						source_name: 'Other choices',
					},
				],
			},
			error: null,
			response: new Response(null),
		});
		const { result } = renderHook(
			() => useMetadataChoiceSuggestions({ enabled: true, fieldType: 'SELECTION', keys: ['status'] }),
			{ wrapper },
		);

		await waitFor(() => expect(result.current.groups).toHaveLength(2));
		const openEntries = result.current.groups
			.flatMap((entry) => entry.options)
			.filter((entry) => entry.value === 'Open');
		expect(openEntries).toHaveLength(2);
		expect(new Set(openEntries.map((entry) => entry.id)).size).toBe(2);
		expect(openEntries.map((entry) => result.current.idToValue.get(entry.id))).toEqual(['Open', 'Open']);
	});

	it('clears previous suggestions when the active type and key change', async () => {
		let resolveSecondRequest: ((value: unknown) => void) | undefined;
		apiState.getMock
			.mockResolvedValueOnce({ data: { results: [group] }, error: null, response: new Response(null) })
			.mockImplementationOnce(
				async () =>
					new Promise((resolve) => {
						resolveSecondRequest = resolve;
					}),
			);
		const { result, rerender } = renderHook(
			(props: { fieldType: 'SELECTION' | 'TAG'; keyName: string }) =>
				useMetadataChoiceSuggestions({ enabled: true, fieldType: props.fieldType, keys: [props.keyName] }),
			{ initialProps: { fieldType: 'SELECTION', keyName: 'status' }, wrapper },
		);

		await waitFor(() => expect(result.current.groups).toHaveLength(1));
		rerender({ fieldType: 'TAG', keyName: 'labels' });
		await waitFor(() => expect(result.current.groups).toEqual([]));
		resolveSecondRequest?.({ data: { results: [] }, error: null, response: new Response(null) });
	});

	it('exposes a local error while leaving the result collection empty', async () => {
		apiState.getMock.mockResolvedValue({
			data: undefined,
			error: { detail: 'Unavailable' },
			response: new Response(null, { status: 503 }),
		});
		const { result } = renderHook(
			() => useMetadataChoiceSuggestions({ enabled: true, fieldType: 'TAG', keys: ['labels'] }),
			{ wrapper },
		);

		await waitFor(() => expect(result.current.isError).toBe(true));
		expect(result.current.groups).toEqual([]);
	});
});
