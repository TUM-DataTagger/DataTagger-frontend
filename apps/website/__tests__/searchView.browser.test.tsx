import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { SearchView } from '@/app/(main)/search/SearchView';
import { buildSearchFilterGroup, compressFiltersParam, decompressFiltersParam } from '@/util/globalSearch';

const nuqsState = vi.hoisted(() => ({
	initialState: {
		created_by: null as string | null,
		filters: null as string | null,
		limit: 25 as number | null,
		my_permissions: null as string | null,
		q: null as string | null,
		sort: null as string | null,
		source: null as string | null,
		view: 'grid',
	},
	setQueryStatesCalls: [] as Record<string, unknown>[],
}));

const apiState = vi.hoisted(() => ({
	getMock: vi.fn(),
	postMock: vi.fn(),
}));

vi.mock('nuqs', async () => {
	const React = await import('react');

	return {
		parseAsBoolean: {},
		parseAsInteger: {
			withDefault: (defaultValue: number) => ({ defaultValue }),
		},
		parseAsString: {
			withDefault: (defaultValue: string) => ({ defaultValue }),
		},
		useQueryState: (_key: string, parser: { readonly defaultValue?: unknown }) => {
			const [value, setValue] = React.useState(parser.defaultValue ?? null);
			return [value, setValue] as const;
		},
		useQueryStates: (schema: Record<string, { readonly defaultValue?: unknown }>) => {
			const initialValue = Object.fromEntries(
				Object.entries(schema).map(([key, parser]) => [
					key,
					nuqsState.initialState[key as keyof typeof nuqsState.initialState] ?? parser.defaultValue ?? null,
				]),
			);
			const [state, setState] = React.useState<Record<string, unknown>>(initialValue);

			return [
				state,
				async (nextValue: Record<string, unknown>) => {
					nuqsState.setQueryStatesCalls.push(nextValue);
					setState((currentState) => ({
						...currentState,
						...nextValue,
					}));
				},
			] as const;
		},
	};
});

vi.mock('usehooks-ts', async () => {
	const React = await import('react');

	return {
		useDebounceValue: <Type,>(initialValue: Type) => {
			const [value, setValue] = React.useState(initialValue);
			React.useEffect(() => {
				setValue(initialValue);
			}, [initialValue]);

			return [value, setValue] as const;
		},
		useMediaQuery: () => false,
	};
});

vi.mock('@/util/clientFetch', async () => {
	const { default: createReactQueryClient } = await import('openapi-react-query');
	const openAPIClient = {
		GET: (...args: unknown[]) => apiState.getMock(...args),
		POST: (...args: unknown[]) => apiState.postMock(...args),
	};
	return {
		openAPIClient,
		$api: createReactQueryClient(openAPIClient as never),
	};
});

const SEARCH_SCHEMA_FIELDS = [
	{
		description: 'Project status',
		enum_values: ['Open', 'Closed'],
		id: 'status',
		metadata_only: false,
		operators: ['eq'],
		operators_by_field_type: {},
		value_type: 'string',
	},
	{
		description: 'Created by',
		enum_values: ['me', 'others'],
		id: 'created_by',
		metadata_only: false,
		operators: ['eq'],
		operators_by_field_type: {},
		value_type: 'string',
	},
	{
		description: 'Membership',
		enum_values: ['admin', 'member'],
		id: 'membership',
		metadata_only: false,
		operators: ['eq'],
		operators_by_field_type: {},
		value_type: 'string',
	},
	{
		description: 'Operator presentation',
		enum_values: [],
		id: 'operator_presentation',
		metadata_only: false,
		operators: [
			'custom_operator',
			'is_empty',
			'lte',
			'contains',
			'in',
			'not_in',
			'gte',
			'lt',
			'is_not',
			'gt',
			'is',
			'between',
		],
		operators_by_field_type: {},
		value_type: 'string',
	},
];

const SEARCH_SCHEMA = {
	default_result_types: ['project', 'folder'],
	response_modes: ['full', 'compact'],
	result_types: ['project', 'folder'],
	sort_directions: ['asc', 'desc'],
	types: {
		project: {
			default_sort: [{ direction: 'desc', field: 'relevance' }],
			default_sort_conditions: [],
			fields: SEARCH_SCHEMA_FIELDS,
			sort_fields: ['relevance', 'created_at'],
		},
		folder: {
			default_sort: [{ direction: 'desc', field: 'relevance' }],
			default_sort_conditions: [],
			fields: SEARCH_SCHEMA_FIELDS,
			sort_fields: ['relevance', 'created_at'],
		},
	},
};

function createProjectSearchResponse(cursor?: { next: string | null; previous: string | null }) {
	return {
		count: 2,
		next_cursor: cursor?.next ?? null,
		previous_cursor: cursor?.previous ?? null,
		results: [
			{
				item: {
					created_by: {
						email: 'owner@example.com',
						full_name: 'Owner Example',
						pk: 1,
						username: 'owner',
					},
					creation_date: '2024-01-15T08:00:00Z',
					folders: [],
					folders_count: 0,
					is_deletable: true,
					last_modification_date: '2024-01-15T08:00:00Z',
					last_modified_by: {
						email: 'owner@example.com',
						full_name: 'Owner Example',
						pk: 1,
						username: 'owner',
					},
					members_count: 1,
					metadata_templates_count: 0,
					name: 'Project Alpha',
					pk: 'project-1',
				},
				result_type: 'project',
			},
		],
	};
}

async function renderSearchView() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
		},
	});

	return render(
		<QueryClientProvider client={queryClient}>
			<SearchView />
		</QueryClientProvider>,
	);
}

async function waitForToolbarControls() {
	await vi.waitFor(() => {
		expect(apiState.getMock).toHaveBeenCalled();
	});

	await expect.element(page.getByText(/Sort by:/)).toBeVisible();
	await expect.element(page.getByText('Source')).toBeVisible();
	await expect.element(page.getByText('Created by')).toBeVisible();
	await expect.element(page.getByText('My permissions')).toBeVisible();
}

type SearchPostRequest = {
	readonly body?: Record<string, unknown> & {
		readonly group?: { readonly conditions?: readonly unknown[] };
	};
};

function getSearchPostRequests(): SearchPostRequest[] {
	return apiState.postMock.mock.calls
		.map((call) => call[1])
		.filter((request): request is SearchPostRequest => request !== null && typeof request === 'object');
}

function expectSearchPostBody(expectedBody: Record<string, unknown>) {
	expect(getSearchPostRequests()).toEqual(
		expect.arrayContaining([
			expect.objectContaining({
				body: expect.objectContaining(expectedBody),
			}),
		]),
	);
}

describe('SearchView browser behavior', () => {
	beforeEach(() => {
		nuqsState.initialState = {
			created_by: null,
			filters: null,
			limit: 25,
			my_permissions: null,
			q: null,
			sort: null,
			source: null,
			view: 'grid',
		};
		nuqsState.setQueryStatesCalls = [];
		apiState.getMock.mockReset();
		apiState.postMock.mockReset();

		apiState.getMock.mockResolvedValue({
			data: SEARCH_SCHEMA,
			response: new Response(null, { status: 200 }),
		});
	});

	it('uses a page-scale search field and clears the query through its clear action', async () => {
		nuqsState.initialState.q = 'Per';

		await renderSearchView();

		const searchInput = page.getByRole('searchbox', { name: 'Search all items' });
		await expect.element(searchInput).toHaveValue('Per');
		expect(getComputedStyle(searchInput.element()).fontSize).toBe('32px');
		expect(getComputedStyle(searchInput.element()).lineHeight).toBe('40px');

		await page.getByRole('button', { name: 'Clear search' }).click();

		await expect.element(searchInput).toHaveValue('');
		await vi.waitFor(() => {
			expect(nuqsState.setQueryStatesCalls).toContainEqual({ q: null });
		});
	});

	it('renders the controlled preset dialog without React Aria warnings', async () => {
		const consoleWarning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

		try {
			await renderSearchView();

			expect(consoleWarning).not.toHaveBeenCalledWith(
				'A PressResponder was rendered without a pressable child. Either call the usePress hook, or wrap your DOM node with <Pressable> component.',
			);

			await waitForToolbarControls();
			await page.getByRole('button', { name: 'Pick a Preset' }).click();
			await page.getByRole('menuitem', { name: 'Metadata', exact: true }).click();
			await expect.element(page.getByRole('alertdialog')).toBeVisible();

			expect(consoleWarning).not.toHaveBeenCalledWith(
				'If a Dialog does not contain a <Heading slot="title">, it must have an aria-label or aria-labelledby attribute for accessibility.',
			);
			expect(consoleWarning).not.toHaveBeenCalledWith(
				'A dialog must have a title for accessibility. Either provide an aria-label or aria-labelledby prop, or render a heading element inside the dialog.',
			);
		} finally {
			consoleWarning.mockRestore();
		}
	});

	it('starts with the Metadata preset open when no advanced filters are present', async () => {
		await renderSearchView();

		await waitForToolbarControls();

		await expect.element(page.getByRole('button', { name: /Advanced/ })).toHaveAttribute('aria-pressed', 'true');
		await expect.element(page.getByText('Show results ...')).toBeVisible();
		await expect.element(page.getByText('All of the following are true ...')).toBeVisible();
		expect(page.getByRole('button', { name: 'Remove condition' }).elements()).toHaveLength(2);
		await expect.element(page.getByRole('button', { name: 'Remove metadata predicate' })).toBeVisible();
	});

	it('prioritizes and labels advanced-search operators without changing their wire ids', async () => {
		nuqsState.initialState.filters = compressFiltersParam([
			{ kind: 'row', field: 'operator_presentation', operator: 'is', value: '' },
		]);

		await renderSearchView();
		await waitForToolbarControls();

		await page.getByRole('button', { name: 'Condition operator' }).click();
		const listbox = page.getByRole('listbox').element();
		expect([...listbox.querySelectorAll('[role="option"]')].map((option) => option.textContent?.trim())).toEqual([
			'is',
			'contains',
			'is_not',
			'is_one_of',
			'>',
			'>=',
			'<',
			'<=',
			'between',
			'is_empty',
			'is_not_one_of',
			'custom_operator',
		]);

		await page.getByRole('option', { name: 'is_one_of' }).click();
		await vi.waitFor(() => {
			const filterUpdate = [...nuqsState.setQueryStatesCalls]
				.reverse()
				.find((call): call is { filters: string } => typeof call.filters === 'string');
			expect(filterUpdate).toBeDefined();
			expect(decompressFiltersParam(filterUpdate!.filters)).toEqual([
				{ kind: 'row', field: 'operator_presentation', operator: 'in', value: [] },
			]);
		});
	});

	it('keeps every Apply preset action inside the modal', async () => {
		await renderSearchView();
		await waitForToolbarControls();

		await page.getByRole('button', { name: 'Pick a Preset' }).click();
		await page.getByRole('menuitem', { name: 'Metadata', exact: true }).click();
		await expect.element(page.getByRole('alertdialog')).toBeVisible();

		const dialog = page.getByRole('alertdialog').element();
		const modalContent = dialog.closest('[data-slot="modal-content"]') as HTMLElement;
		const modalBounds = modalContent.getBoundingClientRect();

		for (const name of ['Cancel', 'Add to existing', 'Replace current filters']) {
			const buttonBounds = page.getByRole('button', { name }).element().getBoundingClientRect();
			expect(buttonBounds.left).toBeGreaterThanOrEqual(modalBounds.left);
			expect(buttonBounds.right).toBeLessThanOrEqual(modalBounds.right);
		}
	});

	it('shows only the concise presets under the Search by heading', async () => {
		await renderSearchView();
		await waitForToolbarControls();

		const presetButton = page.getByRole('button', { name: 'Pick a Preset' });
		expect(presetButton.element().textContent?.trim()).toBe('Pick a Preset');
		expect(presetButton.element().querySelector('svg')).toBeNull();
		await presetButton.click();

		await expect.element(page.getByText('Search by', { exact: true })).toBeVisible();
		const menu = page.getByRole('menu').element();
		expect([...menu.querySelectorAll('[role="menuitem"]')].map((menuItem) => menuItem.textContent?.trim())).toEqual([
			'Metadata',
			'Metadata template',
			'Date range',
			'Numeric range',
		]);
	});

	it('posts merged search payload when toolbar filters and advanced filters are selected', async () => {
		nuqsState.initialState = {
			created_by: 'me',
			filters: compressFiltersParam([{ kind: 'row', field: 'status', operator: 'eq', value: 'Open' }]),
			limit: 25,
			my_permissions: null,
			q: null,
			sort: 'created_at:desc',
			source: 'project',
			view: 'grid',
		};
		apiState.postMock.mockResolvedValue({
			data: {
				count: 0,
				next_cursor: null,
				previous_cursor: null,
				results: [],
			},
			response: new Response(null, { status: 200 }),
		});

		await renderSearchView();
		await waitForToolbarControls();

		const expectedGroup = buildSearchFilterGroup([
			{ kind: 'row', field: 'status', operator: 'eq', value: 'Open' },
			{ kind: 'row', connector: 'AND', field: 'created_by', operator: 'eq', value: 'me' },
		]);
		await vi.waitFor(() => {
			expectSearchPostBody({
				group: expectedGroup,
				result_types: ['project'],
				sort: [{ direction: 'desc', field: 'created_at' }],
			});
		});
		await expect.element(page.getByText('No matching results found')).toBeVisible();
	});

	it('keeps simple toolbar controls on the URL alongside the default advanced preset', async () => {
		apiState.postMock.mockResolvedValue({
			data: {
				count: 0,
				next_cursor: null,
				previous_cursor: null,
				results: [],
			},
			response: new Response(null, { status: 200 }),
		});

		await renderSearchView();
		await waitForToolbarControls();

		await page.getByText('Source').click();
		await page.getByText('Projects').click();

		await vi.waitFor(() => {
			expect(nuqsState.setQueryStatesCalls).toContainEqual({ source: 'project' });
		});
		expect(nuqsState.setQueryStatesCalls.some((call) => 'filters' in call)).toBe(true);
	});

	it('keeps the empty state after manually removing the last advanced filter row', async () => {
		nuqsState.initialState.filters = compressFiltersParam([
			{ kind: 'row', field: 'status', operator: 'eq', value: 'Open' },
		]);
		apiState.postMock.mockResolvedValue({
			data: {
				count: 0,
				next_cursor: null,
				previous_cursor: null,
				results: [],
			},
			response: new Response(null, { status: 200 }),
		});

		await renderSearchView();
		await waitForToolbarControls();

		const expectedGroup = buildSearchFilterGroup([{ kind: 'row', field: 'status', operator: 'eq', value: 'Open' }]);
		await vi.waitFor(() => {
			expectSearchPostBody({ group: expectedGroup });
		});

		await page.getByRole('button', { name: 'Remove condition' }).click();

		await expect.element(page.getByText('Apply conditions for advanced filtering')).toBeVisible();
		const presetButton = page.getByRole('button', { name: 'Pick a Preset' });
		const conditionButton = page.getByRole('button', { name: 'Or add a condition' });
		await expect.element(presetButton).toBeVisible();
		await expect.element(conditionButton).toBeVisible();
		expect(presetButton.element().textContent?.trim()).toBe('Pick a Preset');
		expect(presetButton.element().querySelector('svg')).toBeNull();
		expect(presetButton.element().classList).toContain('bg-base-crystal-300');
		expect(conditionButton.element().classList).toContain('bg-transparent');
		expect(presetButton.element().compareDocumentPosition(conditionButton.element())).toBe(
			Node.DOCUMENT_POSITION_FOLLOWING,
		);
		await vi.waitFor(() => {
			expect(nuqsState.setQueryStatesCalls).toContainEqual({ filters: null });
		});
		await page.getByRole('searchbox', { name: 'Search all items' }).click();
		await expect.element(page.getByText('Apply conditions for advanced filtering')).toBeVisible();
	});

	it('uses cursor pagination when moving to the next result page', async () => {
		nuqsState.initialState.filters = compressFiltersParam([
			{ kind: 'row', field: 'status', operator: 'eq', value: 'Open' },
		]);
		apiState.postMock.mockImplementation(
			async (_path: unknown, request: { readonly body: Record<string, unknown> }) => {
				if (request.body.cursor === 'cursor-2') {
					return {
						data: createProjectSearchResponse({ next: null, previous: 'cursor-1' }),
						response: new Response(null, { status: 200 }),
					};
				}

				return {
					data: createProjectSearchResponse({ next: 'cursor-2', previous: null }),
					response: new Response(null, { status: 200 }),
				};
			},
		);

		await renderSearchView();
		await waitForToolbarControls();

		const expectedGroup = buildSearchFilterGroup([{ kind: 'row', field: 'status', operator: 'eq', value: 'Open' }]);
		await vi.waitFor(() => {
			expectSearchPostBody({ group: expectedGroup });
		});
		await expect.element(page.getByText('Project Alpha').first()).toBeVisible();
		await expect.element(page.getByText('Page 1')).not.toBeInTheDocument();

		const nextPageButton = page.getByRole('button', { name: 'Next page' }).first();
		await expect.element(nextPageButton).toBeEnabled();
		await nextPageButton.click();

		await expect.element(page.getByRole('button', { name: 'Previous page' }).first()).toBeEnabled();
		await expect.element(page.getByRole('button', { name: 'Next page' }).first()).toBeDisabled();
		await expect.element(page.getByText('Page 2')).not.toBeInTheDocument();

		await vi.waitFor(() => {
			expectSearchPostBody({
				cursor: 'cursor-2',
				cursor_direction: 'next',
			});
		});
	});

	it('changes the result limit through the Show menu', async () => {
		nuqsState.initialState.filters = compressFiltersParam([
			{ kind: 'row', field: 'status', operator: 'eq', value: 'Open' },
		]);
		apiState.postMock.mockImplementation(
			async (_path: unknown, request: { readonly body: Record<string, unknown> }) => ({
				data: createProjectSearchResponse(
					request.body.cursor === 'cursor-2'
						? { next: null, previous: 'cursor-1' }
						: { next: 'cursor-2', previous: null },
				),
				response: new Response(null, { status: 200 }),
			}),
		);

		await renderSearchView();
		await waitForToolbarControls();
		await expect.element(page.getByText('Project Alpha').first()).toBeVisible();
		expect(getComputedStyle(page.getByRole('list', { name: 'Search results' }).element()).rowGap).toBe('16px');

		await page.getByRole('button', { name: 'Next page' }).first().click();
		await expect.element(page.getByRole('button', { name: 'Previous page' }).first()).toBeEnabled();

		await page.getByRole('button', { name: 'Results per page: 25' }).first().click();
		await page.getByRole('menuitemradio', { name: '50' }).click();

		await expect.element(page.getByRole('button', { name: 'Previous page' }).first()).toBeDisabled();
		await vi.waitFor(() => {
			const latestBody = getSearchPostRequests().at(-1)?.body;
			expect(latestBody).toMatchObject({ cursor_direction: 'next', limit: 50 });
			expect(latestBody?.cursor).toBeUndefined();
		});
		expect(nuqsState.setQueryStatesCalls).toContainEqual({ limit: 50 });
	});

	it('keeps the advanced filter panel open when clicking outside it', async () => {
		await renderSearchView();
		await waitForToolbarControls();

		await expect.element(page.getByText('Show results ...')).toBeVisible();

		await page.getByRole('searchbox', { name: 'Search all items' }).click({ force: true });

		await expect.element(page.getByText('Show results ...')).toBeVisible();
	});

	it('reflects the advanced trigger pressed state through aria-pressed', async () => {
		await renderSearchView();
		await waitForToolbarControls();

		await expect.element(page.getByRole('button', { name: /Advanced/ })).toHaveAttribute('aria-pressed', 'true');

		await page.getByRole('button', { name: /Advanced/ }).click();

		await expect.element(page.getByRole('button', { name: /Advanced/ })).toHaveAttribute('aria-pressed', 'false');
	});

	it('opens the advanced panel on mount when filters are already present in the URL', async () => {
		nuqsState.initialState.filters = compressFiltersParam([
			{ kind: 'row', field: 'status', operator: 'eq', value: 'Open' },
		]);

		await renderSearchView();
		await waitForToolbarControls();

		await expect.element(page.getByRole('button', { name: /Advanced/ })).toHaveAttribute('aria-pressed', 'true');
		await expect.element(page.getByText('Show results ...')).toBeVisible();
	});
});

const METADATA_SCHEMA_FIELDS = [
	...SEARCH_SCHEMA_FIELDS,
	{
		description: 'Metadata key',
		enum_values: [],
		id: 'metadata.key',
		metadata_only: true,
		operators: ['is', 'is_not', 'in', 'not_in'],
		operators_by_field_type: {},
		value_type: 'string',
	},
	{
		description: 'Metadata value',
		enum_values: [],
		id: 'metadata.value',
		metadata_only: true,
		operators: [
			'contains',
			'is',
			'is_not',
			'in',
			'not_in',
			'lt',
			'gt',
			'between',
			'contains_any',
			'contains_all',
			'contains_none',
			'is_exactly',
			'is_empty',
			'is_not_empty',
		],
		operators_by_field_type: {
			TEXT: ['contains', 'is', 'is_not', 'is_empty', 'is_not_empty'],
			INTEGER: ['is', 'is_not', 'lt', 'gt', 'between', 'is_empty', 'is_not_empty'],
			DATE: ['is', 'is_not', 'lt', 'gt', 'between', 'is_empty', 'is_not_empty'],
			DATETIME: ['is', 'is_not', 'lt', 'gt', 'between', 'is_empty', 'is_not_empty'],
			TIME: ['is', 'is_not', 'lt', 'gt', 'between', 'is_empty', 'is_not_empty'],
			DECIMAL: ['is', 'is_not', 'lt', 'gt', 'between', 'is_empty', 'is_not_empty'],
			SELECTION: ['is', 'is_not', 'in', 'not_in', 'is_empty', 'is_not_empty'],
			MULTI_SELECTION: ['contains_any', 'contains_all', 'contains_none', 'is_exactly', 'is_empty', 'is_not_empty'],
			TAG: ['contains_any', 'contains_all', 'contains_none', 'is_exactly', 'is_empty', 'is_not_empty'],
		},
		value_type: 'mixed',
	},
	{
		description: 'Metadata field type',
		enum_values: ['TEXT', 'INTEGER', 'DATE', 'DATETIME', 'TIME', 'DECIMAL', 'SELECTION', 'MULTI_SELECTION', 'TAG'],
		id: 'metadata.field_type',
		metadata_only: true,
		operators: ['is'],
		operators_by_field_type: {},
		value_type: 'enum',
	},
];

const METADATA_SCHEMA = {
	default_result_types: ['dataset'],
	response_modes: ['full', 'compact'],
	result_types: ['dataset'],
	sort_directions: ['asc', 'desc'],
	types: {
		dataset: {
			default_sort: [{ direction: 'desc', field: 'relevance' }],
			default_sort_conditions: [],
			fields: METADATA_SCHEMA_FIELDS,
			sort_fields: ['relevance', 'created_at'],
		},
	},
};

const METADATA_CHOICE_GROUPS = [
	{
		field_type: 'TAG',
		key: 'labels',
		metadata_template_field_id: 'field-labels',
		metadata_template_id: 'template-version-1',
		metadata_template_name: 'Research template',
		metadata_template_container_name: 'Research choices',
		options: ['First', 'Second'],
		source: 'project',
		source_id: 'project-1',
		source_name: 'Project one',
	},
];

describe('SearchView — Metadata predicate clusters', () => {
	beforeEach(() => {
		nuqsState.initialState = {
			created_by: null,
			filters: null,
			limit: 25,
			my_permissions: null,
			q: null,
			sort: null,
			source: null,
			view: 'grid',
		};
		nuqsState.setQueryStatesCalls = [];
		apiState.getMock.mockReset();
		apiState.postMock.mockReset();
		apiState.getMock.mockImplementation(async (path: string) => ({
			data: path === '/api/v1/search/metadata-choice-options/' ? { results: METADATA_CHOICE_GROUPS } : METADATA_SCHEMA,
			response: new Response(null, { status: 200 }),
		}));
		apiState.postMock.mockResolvedValue({
			data: { count: 0, next_cursor: null, previous_cursor: null, results: [] },
			response: new Response(null, { status: 200 }),
		});
	});

	it('renders a cluster card when the URL state already contains a Metadata predicate cluster', async () => {
		nuqsState.initialState.filters = compressFiltersParam([
			{
				kind: 'cluster',
				rows: [
					{ field: 'metadata.key', operator: 'is', value: 'temperature' },
					{ field: 'metadata.value', operator: 'gt', value: '30' },
				],
			},
		]);

		await renderSearchView();
		await waitForToolbarControls();

		await expect.element(page.getByText('All of the following are true ...')).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Add to this metadata' })).toBeVisible();
	});

	it('emits two nested AND groups for a two-cluster (multi-key) filter state', async () => {
		nuqsState.initialState.filters = compressFiltersParam([
			{
				kind: 'cluster',
				rows: [
					{ field: 'metadata.key', operator: 'is', value: 'temperature' },
					{ field: 'metadata.value', operator: 'gt', value: '30' },
				],
			},
			{
				kind: 'cluster',
				connector: 'AND',
				rows: [
					{ field: 'metadata.key', operator: 'is', value: 'humidity' },
					{ field: 'metadata.value', operator: 'gt', value: '40' },
				],
			},
		]);

		await renderSearchView();
		await waitForToolbarControls();

		const expectedGroup = buildSearchFilterGroup([
			{
				kind: 'cluster',
				rows: [
					{ field: 'metadata.key', operator: 'is', value: 'temperature' },
					{ field: 'metadata.value', operator: 'gt', value: '30' },
				],
			},
			{
				kind: 'cluster',
				connector: 'AND',
				rows: [
					{ field: 'metadata.key', operator: 'is', value: 'humidity' },
					{ field: 'metadata.value', operator: 'gt', value: '40' },
				],
			},
		]);
		await vi.waitFor(() => {
			expectSearchPostBody({ group: expectedGroup });
		});
	});

	it('emits field_type on the cluster metadata.value rule only when the cluster has a narrowing signal', async () => {
		nuqsState.initialState.filters = compressFiltersParam([
			{
				kind: 'cluster',
				rows: [
					{ field: 'metadata.field_type', operator: 'is', value: 'INTEGER' },
					{ field: 'metadata.value', operator: 'gt', value: '42' },
				],
			},
			{
				kind: 'cluster',
				connector: 'AND',
				rows: [{ field: 'metadata.value', operator: 'contains', value: 'foo' }],
			},
		]);

		await renderSearchView();
		await waitForToolbarControls();

		await vi.waitFor(() => {
			const matchingRequest = getSearchPostRequests().find((request) => {
				const conditions = request.body?.group?.conditions ?? [];
				const secondClusterGroup = JSON.stringify(conditions[1] ?? {});
				return (
					JSON.stringify(conditions).includes('"field_type":"INTEGER"') && !secondClusterGroup.includes('field_type')
				);
			});
			expect(matchingRequest).toBeDefined();
		});
	});

	it('renders persisted TAG literals as tokens and emits the exact operator with field type', async () => {
		nuqsState.initialState.filters = compressFiltersParam([
			{
				kind: 'cluster',
				rows: [
					{ field: 'metadata.key', operator: 'is', value: 'labels' },
					{ field: 'metadata.field_type', operator: 'is', value: 'TAG' },
					{
						field: 'metadata.value',
						operator: 'is_exactly',
						value: { selected: ['First', 'Third'], unselected: ['Second'] },
					},
				],
			},
		]);

		await renderSearchView();
		await waitForToolbarControls();

		await expect.element(page.getByRole('button', { name: 'Remove First' })).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Remove Second' })).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Remove Third' })).toBeVisible();
		await vi.waitFor(() => {
			const serializedRequests = JSON.stringify(getSearchPostRequests());
			expect(serializedRequests).toContain(
				'"field":"metadata.value","field_type":"TAG","operator":"is_exactly","value":{"selected":["First","Third"],"unselected":["Second"]}',
			);
		});
	});

	it('authors and toggles TAG value-state requirements, then submits both states', async () => {
		nuqsState.initialState.filters = compressFiltersParam([
			{
				kind: 'cluster',
				rows: [
					{ field: 'metadata.key', operator: 'is', value: 'labels' },
					{ field: 'metadata.field_type', operator: 'is', value: 'TAG' },
					{ field: 'metadata.value', operator: 'contains_any', value: { selected: [], unselected: [] } },
				],
			},
		]);

		await renderSearchView();
		await waitForToolbarControls();
		const input = page.getByRole('combobox', { name: 'Search and add choice values' });
		await input.click();
		await page
			.getByRole('group', { name: /labels · research choices · project project one/i })
			.getByRole('option', { name: 'First' })
			.click({ force: true });
		await input.fill('Third');
		await userEvent.keyboard('{Enter}');

		await expect.element(page.getByRole('button', { name: 'Remove First' })).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Remove Third' })).toBeVisible();
		await page.getByText('First', { exact: true }).click();
		await vi.waitFor(() => {
			const serializedRequests = JSON.stringify(getSearchPostRequests());
			expect(serializedRequests).toContain(
				'"field":"metadata.value","field_type":"TAG","operator":"contains_any","value":{"selected":["Third"],"unselected":["First"]}',
			);
		});
		expect(apiState.getMock).toHaveBeenCalledWith(
			'/api/v1/search/metadata-choice-options/',
			expect.objectContaining({ params: { query: { field_type: 'TAG', key: ['labels'] } } }),
		);
	});

	it('supports keyless SELECTION free entry and submits without loading suggestions', async () => {
		nuqsState.initialState.filters = compressFiltersParam([
			{
				kind: 'cluster',
				rows: [
					{ field: 'metadata.field_type', operator: 'is', value: 'SELECTION' },
					{ field: 'metadata.value', operator: 'is', value: '' },
				],
			},
		]);

		await renderSearchView();
		await waitForToolbarControls();
		await page.getByRole('combobox', { name: 'Choice value' }).fill('Ad hoc value');

		await vi.waitFor(() => {
			const serializedRequests = JSON.stringify(getSearchPostRequests());
			expect(serializedRequests).toContain(
				'"field":"metadata.value","field_type":"SELECTION","operator":"is","value":"Ad hoc value"',
			);
		});
		expect(apiState.getMock.mock.calls.some((call) => call[0] === '/api/v1/search/metadata-choice-options/')).toBe(
			false,
		);
	});

	it('retains literals but omits an unsafe exact-set row after changing TAG to SELECTION', async () => {
		nuqsState.initialState.filters = compressFiltersParam([
			{
				kind: 'cluster',
				rows: [
					{ field: 'metadata.key', operator: 'is', value: 'labels' },
					{ field: 'metadata.field_type', operator: 'is', value: 'TAG' },
					{
						field: 'metadata.value',
						operator: 'is_exactly',
						value: { selected: ['First'], unselected: ['Third'] },
					},
				],
			},
		]);

		await renderSearchView();
		await waitForToolbarControls();
		apiState.postMock.mockClear();

		await page.getByRole('button', { name: 'Condition value' }).click();
		await page.getByRole('option', { name: 'SELECTION', exact: true }).click();

		await expect.element(page.getByText(/choose a compatible operator/i)).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Remove First' })).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Remove Third' })).toBeVisible();
		await vi.waitFor(() => {
			const serializedRequests = JSON.stringify(getSearchPostRequests());
			expect(serializedRequests).toContain('"field":"metadata.field_type","operator":"is","value":"SELECTION"');
			expect(serializedRequests).not.toContain('"field":"metadata.value"');
		});

		await page.getByRole('button', { name: 'Condition value' }).click();
		await page.getByRole('option', { name: 'TAG', exact: true }).click();
		await expect.element(page.getByText(/choose a compatible operator/i)).not.toBeInTheDocument();
		await vi.waitFor(() => {
			const serializedRequests = JSON.stringify(getSearchPostRequests());
			expect(serializedRequests).toContain(
				'"field":"metadata.value","field_type":"TAG","operator":"is_exactly","value":{"selected":["First"],"unselected":["Third"]}',
			);
		});
	});

	it('removes the cluster card when the user removes the only row in the cluster', async () => {
		nuqsState.initialState.filters = compressFiltersParam([
			{
				kind: 'cluster',
				rows: [{ field: 'metadata.key', operator: 'is', value: 'temperature' }],
			},
		]);

		await renderSearchView();
		await waitForToolbarControls();

		await expect.element(page.getByText('All of the following are true ...')).toBeVisible();
		await page.getByRole('button', { name: 'Remove metadata row' }).click();
		await expect.element(page.getByText('All of the following are true ...')).not.toBeInTheDocument();
		await expect.element(page.getByText('Apply conditions for advanced filtering')).toBeVisible();
	});

	it('removes the cluster card when the user clicks the cluster-level delete', async () => {
		nuqsState.initialState.filters = compressFiltersParam([
			{
				kind: 'cluster',
				rows: [
					{ field: 'metadata.key', operator: 'is', value: 'temperature' },
					{ field: 'metadata.value', operator: 'gt', value: '30' },
				],
			},
		]);

		await renderSearchView();
		await waitForToolbarControls();

		await expect.element(page.getByText('All of the following are true ...')).toBeVisible();
		await page.getByRole('button', { name: 'Remove metadata predicate' }).click();
		await expect.element(page.getByText('All of the following are true ...')).not.toBeInTheDocument();
	});
});
