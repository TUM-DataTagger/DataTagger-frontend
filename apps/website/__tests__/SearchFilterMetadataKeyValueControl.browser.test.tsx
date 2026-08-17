import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { SearchFilterMetadataKeyValueControl } from '@/app/(main)/search/SearchFilterMetadataKeyValueControl';
import type { MetadataKeyScope } from '@/util/filterContext';
import type { SearchFilterValue } from '@/util/globalSearch';

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

function createQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: { retry: false },
		},
	});
}

function scopeOf(input: { kind: 'project' | 'folder' | 'dataset'; id?: string; name?: string }): MetadataKeyScope {
	const base: MetadataKeyScope = {
		projectIds: [],
		folderIds: [],
		datasetIds: [],
		templateIds: [],
		projectNames: [],
		folderNames: [],
		datasetNames: [],
		templateNames: [],
	};
	const value = input.id ?? input.name;
	if (value === undefined) {
		return base;
	}
	const by: 'Ids' | 'Names' = input.id === undefined ? 'Names' : 'Ids';
	const field = `${input.kind}${by}` as keyof MetadataKeyScope;
	return { ...base, [field]: [value] };
}

function Harness(props: {
	readonly initialValue?: SearchFilterValue;
	readonly operator?: string;
	readonly scope?: MetadataKeyScope;
}) {
	const [value, setValue] = useState<SearchFilterValue>(props.initialValue ?? '');

	return (
		<QueryClientProvider client={createQueryClient()}>
			<SearchFilterMetadataKeyValueControl
				onValueChange={setValue}
				operator={props.operator ?? 'is'}
				scope={props.scope}
				value={value}
			/>
		</QueryClientProvider>
	);
}

describe('SearchFilterMetadataKeyValueControl', () => {
	beforeEach(() => {
		apiState.getMock.mockReset();
	});

	it('renders fetched template keys as combobox items when a scope is present', async () => {
		apiState.getMock.mockResolvedValue({
			data: {
				results: [
					{ key: 'price', field_type: 'INTEGER', source: 'project', is_linked: false },
					{ key: 'author', field_type: 'TEXT', source: 'project', is_linked: false },
				],
			},
			error: null,
			response: new Response(null, { status: 200 }),
		});

		const screen = await render(<Harness scope={scopeOf({ kind: 'project', id: 'proj-1' })} />);

		await screen.getByRole('combobox', { name: /condition value/i }).click();

		await expect.element(page.getByRole('option', { name: 'price' })).toBeVisible();
		await expect.element(page.getByRole('option', { name: 'author' })).toBeVisible();
	});

	it('accepts a typed custom value that is not in the suggestion list', async () => {
		apiState.getMock.mockResolvedValue({
			data: { results: [{ key: 'price', field_type: 'INTEGER', source: 'project', is_linked: false }] },
			error: null,
			response: new Response(null, { status: 200 }),
		});

		const onValueChange = vi.fn();

		const screen = await render(
			<QueryClientProvider client={createQueryClient()}>
				<SearchFilterMetadataKeyValueControl
					onValueChange={onValueChange}
					operator="is"
					scope={scopeOf({ kind: 'project', id: 'proj-1' })}
					value=""
				/>
			</QueryClientProvider>,
		);

		const input = screen.getByRole('combobox', { name: /condition value/i });
		await input.fill('my_custom_key');

		await vi.waitFor(() => {
			expect(onValueChange).toHaveBeenLastCalledWith('my_custom_key');
		});
	});

	it('renders a plain text input and makes no API call when the operator is in STRING_ONLY_OPERATORS', async () => {
		await render(<Harness operator="contains" scope={scopeOf({ kind: 'project', id: 'proj-1' })} />);

		await expect.element(page.getByRole('textbox', { name: /condition value/i })).toBeVisible();
		expect(page.getByRole('combobox', { name: /condition value/i }).query()).toBeNull();
		expect(apiState.getMock).not.toHaveBeenCalled();
	});

	it('renders fetched suggestion keys while typing', async () => {
		apiState.getMock.mockResolvedValue({
			data: {
				results: [{ key: 'price', field_type: 'INTEGER', source: 'project', is_linked: false }],
			},
			error: null,
			response: new Response(null, { status: 200 }),
		});

		const onValueChange = vi.fn();

		const screen = await render(
			<QueryClientProvider client={createQueryClient()}>
				<SearchFilterMetadataKeyValueControl
					onValueChange={onValueChange}
					operator="is"
					scope={scopeOf({ kind: 'project', id: 'proj-1' })}
					value=""
				/>
			</QueryClientProvider>,
		);

		const combobox = screen.getByRole('combobox', { name: /condition value/i });
		await combobox.click();
		await combobox.fill('p');

		await expect.element(page.getByRole('option', { name: 'price' })).toBeVisible();
	});

	it('re-fetches when the scope changes and leaves the row value unchanged', async () => {
		apiState.getMock.mockImplementation(async (_path, options) => {
			const folderIds = (options as { params: { query: { folder_id?: readonly string[] } } }).params.query.folder_id;
			const folderId = folderIds?.[0];
			return {
				data: { results: [{ key: `key-for-${folderId}`, field_type: 'TEXT', source: 'folder', is_linked: false }] },
				error: null,
				response: new Response(null, { status: 200 }),
			};
		});

		const onValueChange = vi.fn();

		function ScopeSwitchHarness() {
			const [scope, setScope] = useState<MetadataKeyScope>(scopeOf({ kind: 'folder', id: 'fol-A' }));
			return (
				<QueryClientProvider client={createQueryClient()}>
					<SearchFilterMetadataKeyValueControl
						onValueChange={onValueChange}
						operator="is"
						scope={scope}
						value="my_existing_key"
					/>
					<button onClick={() => setScope(scopeOf({ kind: 'folder', id: 'fol-B' }))} type="button">
						Switch scope
					</button>
				</QueryClientProvider>
			);
		}

		const screen = await render(<ScopeSwitchHarness />);

		await vi.waitFor(() => {
			expect(apiState.getMock).toHaveBeenCalledWith(
				'/api/v1/search/metadata-keys/',
				expect.objectContaining({
					params: expect.objectContaining({ query: { folder_id: ['fol-A'] } }),
				}),
			);
		});

		await screen.getByRole('button', { name: 'Switch scope' }).click();

		await vi.waitFor(() => {
			expect(apiState.getMock).toHaveBeenCalledWith(
				'/api/v1/search/metadata-keys/',
				expect.objectContaining({
					params: expect.objectContaining({ query: { folder_id: ['fol-B'] } }),
				}),
			);
		});

		expect(onValueChange).not.toHaveBeenCalled();
	});

	it('groups suggestions by source with bare-label section titles', async () => {
		apiState.getMock.mockResolvedValue({
			data: {
				results: [
					{ key: 'price', field_type: 'INTEGER', source: 'folder', is_linked: false },
					{ key: 'author', field_type: 'TEXT', source: 'project', is_linked: false },
				],
			},
			error: null,
			response: new Response(null, { status: 200 }),
		});

		const screen = await render(<Harness scope={scopeOf({ kind: 'folder', id: 'fol-1' })} />);

		await screen.getByRole('combobox', { name: /condition value/i }).click();

		await expect.element(page.getByRole('group', { name: 'Folder' })).toBeVisible();
		await expect.element(page.getByRole('group', { name: 'Project' })).toBeVisible();
	});

	it('shows a field_type chip next to each suggestion', async () => {
		apiState.getMock.mockResolvedValue({
			data: {
				results: [{ key: 'price', field_type: 'INTEGER', source: 'project', is_linked: false }],
			},
			error: null,
			response: new Response(null, { status: 200 }),
		});

		const screen = await render(<Harness scope={scopeOf({ kind: 'project', id: 'proj-1' })} />);

		await screen.getByRole('combobox', { name: /condition value/i }).click();

		await expect.element(page.getByRole('option', { name: /price/ })).toHaveTextContent(/INTEGER/);
	});

	it('renders duplicate keys across sources without deduplication', async () => {
		apiState.getMock.mockResolvedValue({
			data: {
				results: [
					{ key: 'shared_key', field_type: 'TEXT', source: 'folder', is_linked: false },
					{ key: 'shared_key', field_type: 'TEXT', source: 'project', is_linked: false },
				],
			},
			error: null,
			response: new Response(null, { status: 200 }),
		});

		const screen = await render(<Harness scope={scopeOf({ kind: 'folder', id: 'fol-1' })} />);

		await screen.getByRole('combobox', { name: /condition value/i }).click();

		const folderGroup = page.getByRole('group', { name: 'Folder' });
		const projectGroup = page.getByRole('group', { name: 'Project' });

		await expect.element(folderGroup.getByRole('option', { name: /shared_key/ })).toBeVisible();
		await expect.element(projectGroup.getByRole('option', { name: /shared_key/ })).toBeVisible();
	});

	it('does not call the API when no scope is provided', async () => {
		const screen = await render(<Harness operator="is" />);

		await screen.getByRole('combobox', { name: /condition value/i }).click();

		await expect.element(page.getByRole('combobox', { name: /condition value/i })).toBeVisible();
		expect(apiState.getMock).not.toHaveBeenCalled();
	});

	it('shows the "Add a project, folder, or dataset filter" hint when no scope is present', async () => {
		const screen = await render(<Harness operator="is" />);

		await screen.getByRole('combobox', { name: /condition value/i }).click();

		await expect
			.element(page.getByText(/add a project, folder, or dataset filter to see template-suggested keys/i))
			.toBeVisible();
	});

	it('shows the "No template keys configured" hint when the endpoint returns zero results', async () => {
		apiState.getMock.mockResolvedValue({
			data: { results: [] },
			error: null,
			response: new Response(null, { status: 200 }),
		});

		const screen = await render(<Harness scope={scopeOf({ kind: 'folder', id: 'fol-1' })} />);

		await screen.getByRole('combobox', { name: /condition value/i }).click();

		await expect.element(page.getByText(/no template keys configured for the selected scope/i)).toBeVisible();
	});

	it('renders chip-style multi-select with template suggestions when operator is in', async () => {
		apiState.getMock.mockResolvedValue({
			data: {
				results: [
					{ key: 'price', field_type: 'INTEGER', source: 'project', is_linked: false },
					{ key: 'author', field_type: 'TEXT', source: 'project', is_linked: false },
				],
			},
			error: null,
			response: new Response(null, { status: 200 }),
		});

		const onValueChange = vi.fn();

		const screen = await render(
			<QueryClientProvider client={createQueryClient()}>
				<SearchFilterMetadataKeyValueControl
					onValueChange={onValueChange}
					operator="in"
					scope={scopeOf({ kind: 'project', id: 'proj-1' })}
					value={[]}
				/>
			</QueryClientProvider>,
		);

		await screen.getByRole('combobox', { name: /add value/i }).click();
		await expect.element(page.getByRole('option', { name: /price/ })).toBeVisible();
	});

	it('accepts a typed custom value in multi-select mode', async () => {
		apiState.getMock.mockResolvedValue({
			data: { results: [{ key: 'price', field_type: 'INTEGER', source: 'project', is_linked: false }] },
			error: null,
			response: new Response(null, { status: 200 }),
		});

		const onValueChange = vi.fn();

		const screen = await render(
			<QueryClientProvider client={createQueryClient()}>
				<SearchFilterMetadataKeyValueControl
					onValueChange={onValueChange}
					operator="in"
					scope={scopeOf({ kind: 'project', id: 'proj-1' })}
					value={[]}
				/>
			</QueryClientProvider>,
		);

		const input = screen.getByRole('combobox', { name: /add value/i });
		await input.click();
		await userEvent.keyboard('my_custom_key{Enter}');

		await vi.waitFor(() => {
			expect(onValueChange).toHaveBeenCalledWith(['my_custom_key']);
		});
	});

	it('shares the metadata-keys cache between is and in rows under the same scope', async () => {
		apiState.getMock.mockResolvedValue({
			data: { results: [{ key: 'price', field_type: 'INTEGER', source: 'project', is_linked: false }] },
			error: null,
			response: new Response(null, { status: 200 }),
		});

		const queryClient = createQueryClient();

		await render(
			<QueryClientProvider client={queryClient}>
				<SearchFilterMetadataKeyValueControl
					onValueChange={vi.fn()}
					operator="is"
					scope={scopeOf({ kind: 'project', id: 'proj-1' })}
					value=""
				/>
				<SearchFilterMetadataKeyValueControl
					onValueChange={vi.fn()}
					operator="in"
					scope={scopeOf({ kind: 'project', id: 'proj-1' })}
					value={[]}
				/>
			</QueryClientProvider>,
		);

		await vi.waitFor(() => {
			expect(apiState.getMock).toHaveBeenCalled();
		});

		expect(apiState.getMock).toHaveBeenCalledTimes(1);
	});

	it('resolves a name-based scope to a pk before fetching metadata-keys', async () => {
		apiState.getMock.mockImplementation(async (path) => {
			if (path === '/api/v1/folder/') {
				return {
					data: { results: [{ pk: 'fol-resolved', name: 'My Folder' }] },
					error: null,
					response: new Response(null, { status: 200 }),
				};
			}
			return {
				data: {
					results: [{ key: 'resolved_key', field_type: 'TEXT', source: 'folder', is_linked: false }],
				},
				error: null,
				response: new Response(null, { status: 200 }),
			};
		});

		const screen = await render(<Harness scope={scopeOf({ kind: 'folder', name: 'My Folder' })} />);

		await screen.getByRole('combobox', { name: /condition value/i }).click();

		await expect.element(page.getByRole('option', { name: 'resolved_key' })).toBeVisible();

		expect(apiState.getMock).toHaveBeenCalledWith(
			'/api/v1/folder/',
			expect.objectContaining({
				params: expect.objectContaining({ query: expect.objectContaining({ search: 'My Folder' }) }),
			}),
		);
		expect(apiState.getMock).toHaveBeenCalledWith(
			'/api/v1/search/metadata-keys/',
			expect.objectContaining({
				params: expect.objectContaining({ query: { folder_id: ['fol-resolved'] } }),
			}),
		);
	});

	it('does not fetch metadata-keys when name-based scope has no exact match', async () => {
		apiState.getMock.mockImplementation(async (path) => {
			if (path === '/api/v1/folder/') {
				return {
					data: { results: [{ pk: 'fol-other', name: 'My Folder Foo' }] },
					error: null,
					response: new Response(null, { status: 200 }),
				};
			}
			return {
				data: { results: [] },
				error: null,
				response: new Response(null, { status: 200 }),
			};
		});

		const screen = await render(<Harness scope={scopeOf({ kind: 'folder', name: 'My Folder' })} />);

		await screen.getByRole('combobox', { name: /condition value/i }).click();

		await vi.waitFor(() => {
			expect(apiState.getMock).toHaveBeenCalledWith('/api/v1/folder/', expect.anything());
		});

		expect(apiState.getMock).not.toHaveBeenCalledWith('/api/v1/search/metadata-keys/', expect.anything());
	});

	it('forwards array-shaped scope ids across kinds to the metadata-keys endpoint', async () => {
		apiState.getMock.mockResolvedValue({
			data: { results: [] },
			error: null,
			response: new Response(null, { status: 200 }),
		});

		const multiScope: MetadataKeyScope = {
			projectIds: ['proj-A'],
			folderIds: ['fol-1', 'fol-2'],
			datasetIds: [],
			templateIds: [],
			projectNames: [],
			folderNames: [],
			datasetNames: [],
			templateNames: [],
		};

		await render(
			<QueryClientProvider client={createQueryClient()}>
				<SearchFilterMetadataKeyValueControl onValueChange={() => {}} operator="is" scope={multiScope} value="" />
			</QueryClientProvider>,
		);

		await vi.waitFor(() => {
			expect(apiState.getMock).toHaveBeenCalledWith(
				'/api/v1/search/metadata-keys/',
				expect.objectContaining({
					params: expect.objectContaining({
						query: { project_id: ['proj-A'], folder_id: ['fol-1', 'fol-2'] },
					}),
				}),
			);
		});
	});

	it('clears stale suggestions when scope is removed', async () => {
		apiState.getMock.mockResolvedValue({
			data: {
				results: [{ key: 'stale_key', field_type: 'TEXT', source: 'folder', is_linked: false }],
			},
			error: null,
			response: new Response(null, { status: 200 }),
		});

		function ScopeToggle() {
			const [scope, setScope] = useState<MetadataKeyScope | undefined>(scopeOf({ kind: 'folder', id: 'fol-1' }));
			return (
				<QueryClientProvider client={createQueryClient()}>
					<button onClick={() => setScope(undefined)} type="button">
						clear scope
					</button>
					<SearchFilterMetadataKeyValueControl onValueChange={() => {}} operator="is" scope={scope} value="" />
				</QueryClientProvider>
			);
		}

		const screen = await render(<ScopeToggle />);

		await screen.getByRole('combobox', { name: /condition value/i }).click();
		await expect.element(page.getByRole('option', { name: 'stale_key' })).toBeVisible();
		await userEvent.keyboard('{Escape}');

		await screen.getByRole('button', { name: /clear scope/i }).click();
		await screen.getByRole('combobox', { name: /condition value/i }).click();

		await expect
			.element(page.getByText(/add a project, folder, or dataset filter to see template-suggested keys/i))
			.toBeVisible();
		await expect.element(page.getByRole('option', { name: 'stale_key' })).not.toBeInTheDocument();
	});

	it('does not commit the informational hint as a value via keyboard selection', async () => {
		const onValueChange = vi.fn();

		const screen = await render(
			<QueryClientProvider client={createQueryClient()}>
				<SearchFilterMetadataKeyValueControl onValueChange={onValueChange} operator="is" scope={undefined} value="" />
			</QueryClientProvider>,
		);

		await screen.getByRole('combobox', { name: /condition value/i }).click();
		await userEvent.keyboard('{ArrowDown}{Enter}');

		expect(onValueChange).not.toHaveBeenCalledWith(expect.stringMatching(/add a project, folder, or dataset filter/i));
		expect(onValueChange).not.toHaveBeenCalledWith('__metadata-key-hint__');
	});
});
