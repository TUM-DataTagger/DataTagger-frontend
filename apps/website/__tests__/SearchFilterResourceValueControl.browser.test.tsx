import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { SearchFilterResourceValueControl } from '@/app/(main)/search/SearchFilterResourceValueControl';
import { getTypeaheadConfig, type SearchFilterValue } from '@/util/globalSearch';

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

function mockPagedProjectResults() {
	apiState.getMock.mockImplementation(async (_path, options) => {
		const query = (options as { params?: { query?: { offset?: number } } }).params?.query;
		const offset = query?.offset ?? 0;
		return {
			data: {
				count: 26,
				next: offset === 0 ? 'next-page' : null,
				previous: null,
				results:
					offset === 0
						? [
								{ pk: 'project-1', name: 'Alpha project' },
								{ pk: 'project-2', name: 'Beta project' },
							]
						: [{ pk: 'project-26', name: 'Gamma project' }],
			},
			error: null,
			response: new Response(null, { status: 200 }),
		};
	});
}

function scrollOpenListToEnd() {
	const listbox = page.getByRole('listbox').element();
	const scroller = listbox.parentElement;
	if (!scroller) {
		throw new Error('Open listbox scroller is missing');
	}
	scroller.scrollTop = scroller.scrollHeight;
	scroller.dispatchEvent(new Event('scroll', { bubbles: true }));
}

function Harness(props: {
	readonly entityLabels?: Record<string, string>;
	readonly fieldId?: string;
	onEntityLabelsChange?(labels: Record<string, string>): void;
	onValueChange?(value: SearchFilterValue): void;
	readonly operator?: string;
	readonly value?: SearchFilterValue;
}) {
	const config = getTypeaheadConfig(props.fieldId ?? 'project_name');
	if (!config) {
		throw new Error(`${props.fieldId ?? 'project_name'} typeahead config is missing`);
	}

	return (
		<QueryClientProvider client={createQueryClient()}>
			<SearchFilterResourceValueControl
				config={config}
				entityLabels={props.entityLabels}
				onEntityLabelsChange={props.onEntityLabelsChange}
				onValueChange={props.onValueChange ?? vi.fn()}
				operator={props.operator ?? 'is'}
				value={props.value ?? ''}
			/>
		</QueryClientProvider>
	);
}

function StatefulProjectIdHarness() {
	const [value, setValue] = useState<SearchFilterValue>('project-1');
	const [entityLabels, setEntityLabels] = useState<Record<string, string>>({ 'project-1': 'Selected project' });
	const config = getTypeaheadConfig('project_id');
	if (!config) {
		throw new Error('project_id typeahead config is missing');
	}

	return (
		<QueryClientProvider client={createQueryClient()}>
			<SearchFilterResourceValueControl
				config={config}
				entityLabels={entityLabels}
				onEntityLabelsChange={setEntityLabels}
				onValueChange={setValue}
				operator="is"
				value={value}
			/>
		</QueryClientProvider>
	);
}

function StatefulMultiValueHarness(props: {
	readonly fieldId?: string;
	readonly initialLabels?: Record<string, string>;
	readonly initialValue?: string[];
	readonly operator?: string;
}) {
	const [value, setValue] = useState<SearchFilterValue>(props.initialValue ?? ['project-1']);
	const [entityLabels, setEntityLabels] = useState<Record<string, string>>(
		props.initialLabels ?? { 'project-1': 'Alpha project' },
	);
	const config = getTypeaheadConfig(props.fieldId ?? 'project_id');
	if (!config) {
		throw new Error(`${props.fieldId ?? 'project_id'} typeahead config is missing`);
	}

	return (
		<QueryClientProvider client={createQueryClient()}>
			<SearchFilterResourceValueControl
				config={config}
				entityLabels={entityLabels}
				onEntityLabelsChange={setEntityLabels}
				onValueChange={setValue}
				operator={props.operator ?? 'in'}
				value={value}
			/>
		</QueryClientProvider>
	);
}

describe('SearchFilterResourceValueControl', () => {
	beforeEach(() => {
		apiState.getMock.mockReset();
		apiState.getMock.mockResolvedValue({
			data: {
				count: 2,
				next: null,
				previous: null,
				results: [
					{ pk: 'project-1', name: 'Alpha project' },
					{ pk: 'project-2', name: 'Beta project' },
				],
			},
			error: null,
			response: new Response(null, { status: 200 }),
		});
	});

	it('requests deterministic first-page resource value suggestions when opened with an empty query', async () => {
		const screen = await render(<Harness />);

		await screen.getByRole('combobox', { name: /condition value/i }).click();

		await vi.waitFor(() => {
			expect(apiState.getMock).toHaveBeenCalledWith(
				'/api/v1/project/',
				expect.objectContaining({
					params: {
						query: {
							limit: 25,
							offset: 0,
							ordering: 'name',
							search: '',
						},
					},
				}),
			);
		});
		await expect.element(page.getByRole('option', { name: 'Alpha project' })).toBeVisible();
		await expect.element(page.getByRole('option', { name: 'Beta project' })).toBeVisible();
	});

	it('requests typed resource value suggestions with deterministic ordering', async () => {
		const screen = await render(<Harness />);

		const input = screen.getByRole('combobox', { name: /condition value/i });
		await input.click();
		await input.fill('bet');

		await vi.waitFor(() => {
			expect(apiState.getMock).toHaveBeenCalledWith(
				'/api/v1/project/',
				expect.objectContaining({
					params: {
						query: {
							limit: 25,
							offset: 0,
							ordering: 'name',
							search: 'bet',
						},
					},
				}),
			);
		});
	});

	it('opens a populated single-value id field with an empty suggestion query while preserving the stored value', async () => {
		const onValueChange = vi.fn();
		const screen = await render(
			<Harness
				entityLabels={{ 'project-1': 'Selected project' }}
				fieldId="project_id"
				onValueChange={onValueChange}
				value="project-1"
			/>,
		);

		await screen.getByRole('combobox', { name: /condition value/i }).click();

		await vi.waitFor(() => {
			expect(apiState.getMock).toHaveBeenCalledWith(
				'/api/v1/project/',
				expect.objectContaining({
					params: expect.objectContaining({
						query: expect.objectContaining({ search: '' }),
					}),
				}),
			);
		});
		await expect.element(page.getByRole('group', { name: 'Current selection' })).toBeVisible();
		await expect
			.element(page.getByRole('option', { name: 'Selected project' }))
			.toHaveAttribute('aria-disabled', 'true');
		expect(onValueChange).not.toHaveBeenCalled();
	});

	it('restores the selected label when a populated single-value control is closed without replacement', async () => {
		const screen = await render(
			<Harness entityLabels={{ 'project-1': 'Selected project' }} fieldId="project_id" value="project-1" />,
		);

		const input = screen.getByRole('combobox', { name: /condition value/i });
		await input.click();
		await expect.element(input).toHaveValue('');

		await userEvent.keyboard('{Escape}');

		await expect.element(input).toHaveValue('Selected project');
	});

	it('replaces a populated single-value id field and updates the displayed label', async () => {
		const screen = await render(<StatefulProjectIdHarness />);

		const input = screen.getByRole('combobox', { name: /condition value/i });
		await input.click();
		await page.getByRole('option', { name: 'Beta project' }).click({ force: true });

		await expect.element(input).toHaveValue('Beta project');
	});

	it('commits custom typed values for name-backed single-value fields', async () => {
		const onValueChange = vi.fn();
		const screen = await render(<Harness onValueChange={onValueChange} />);

		const input = screen.getByRole('combobox', { name: /condition value/i });
		await input.click();
		await input.fill('Project without suggestion');

		await vi.waitFor(() => {
			expect(onValueChange).toHaveBeenLastCalledWith('Project without suggestion');
		});
	});

	it('does not commit custom typed values for id-backed single-value fields', async () => {
		const onValueChange = vi.fn();
		const screen = await render(
			<Harness entityLabels={{ 'project-1': 'Selected project' }} fieldId="project_id" onValueChange={onValueChange} />,
		);

		const input = screen.getByRole('combobox', { name: /condition value/i });
		await input.click();
		await input.fill('not-a-project-id');
		await userEvent.keyboard('{Enter}');

		expect(onValueChange).not.toHaveBeenCalled();
	});

	it('renders selected id values as chips for an in row and omits them from suggestions', async () => {
		const screen = await render(
			<Harness
				entityLabels={{ 'project-1': 'Alpha project' }}
				fieldId="project_id"
				operator="in"
				value={['project-1']}
			/>,
		);

		await expect.element(page.getByRole('button', { name: 'Remove Alpha project' })).toBeVisible();

		await screen.getByRole('combobox', { name: /add value/i }).click();

		await expect.element(page.getByRole('option', { name: 'Alpha project' })).not.toBeInTheDocument();
		await expect.element(page.getByRole('option', { name: 'Beta project' })).toBeVisible();
	});

	it('uses the same chip picker for a not_in resource row', async () => {
		const screen = await render(
			<Harness
				entityLabels={{ 'project-1': 'Alpha project' }}
				fieldId="project_id"
				operator="not_in"
				value={['project-1']}
			/>,
		);

		await expect.element(page.getByRole('button', { name: 'Remove Alpha project' })).toBeVisible();

		await screen.getByRole('combobox', { name: /add value/i }).click();

		await expect.element(page.getByRole('option', { name: 'Beta project' })).toBeVisible();
	});

	it('appends selected multi-value suggestions and clears the add-value input', async () => {
		const screen = await render(<StatefulMultiValueHarness />);

		const input = screen.getByRole('combobox', { name: /add value/i });
		await input.click();
		await page.getByRole('option', { name: 'Beta project' }).click({ force: true });
		await userEvent.keyboard('{Escape}');

		await expect.element(page.getByRole('button', { name: 'Remove Alpha project' })).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Remove Beta project' })).toBeVisible();
		await expect.element(input).toHaveValue('');
	});

	it('makes a removed chip selectable again', async () => {
		const screen = await render(<StatefulMultiValueHarness />);

		await page.getByRole('button', { name: 'Remove Alpha project' }).click();
		await screen.getByRole('combobox', { name: /add value/i }).click();

		await expect.element(page.getByRole('option', { name: 'Alpha project' })).toBeVisible();
	});

	it('commits custom typed chips for name-backed multi-value fields', async () => {
		apiState.getMock.mockResolvedValue({
			data: {
				count: 0,
				next: null,
				previous: null,
				results: [],
			},
			error: null,
			response: new Response(null, { status: 200 }),
		});
		const screen = await render(
			<StatefulMultiValueHarness fieldId="project_name" initialLabels={{}} initialValue={[]} />,
		);

		const input = screen.getByRole('combobox', { name: /add value/i });
		await input.click();
		await userEvent.keyboard('Project without suggestion{Enter}');

		await expect.element(page.getByRole('button', { name: 'Remove Project without suggestion' })).toBeVisible();
		await expect.element(input).toHaveValue('');
	});

	it('does not commit custom typed chips for id-backed multi-value fields', async () => {
		const onValueChange = vi.fn();
		const screen = await render(
			<Harness fieldId="project_id" onValueChange={onValueChange} operator="in" value={[]} />,
		);

		const input = screen.getByRole('combobox', { name: /add value/i });
		await input.click();
		await userEvent.keyboard('not-a-project-id{Enter}');

		expect(onValueChange).not.toHaveBeenCalled();
	});

	it('loads and appends the next resource page in a single-value control', async () => {
		mockPagedProjectResults();
		const screen = await render(<Harness />);

		await screen.getByRole('combobox', { name: /condition value/i }).click();
		await expect.element(page.getByRole('option', { name: 'Alpha project' })).toBeVisible();

		scrollOpenListToEnd();

		await vi.waitFor(() => {
			expect(apiState.getMock).toHaveBeenCalledWith(
				'/api/v1/project/',
				expect.objectContaining({
					params: expect.objectContaining({
						query: expect.objectContaining({ offset: 25 }),
					}),
				}),
			);
		});
		await expect.element(page.getByRole('option', { name: 'Alpha project' })).toBeVisible();
		await expect.element(page.getByRole('option', { name: 'Gamma project' })).toBeVisible();
	});

	it('loads and appends the next resource page in a multi-value control', async () => {
		mockPagedProjectResults();
		const screen = await render(<StatefulMultiValueHarness initialLabels={{}} initialValue={[]} />);

		await screen.getByRole('combobox', { name: /add value/i }).click();
		await expect.element(page.getByRole('option', { name: 'Alpha project' })).toBeVisible();

		scrollOpenListToEnd();

		await vi.waitFor(() => {
			expect(apiState.getMock).toHaveBeenCalledWith(
				'/api/v1/project/',
				expect.objectContaining({
					params: expect.objectContaining({
						query: expect.objectContaining({ offset: 25 }),
					}),
				}),
			);
		});
		await expect.element(page.getByRole('option', { name: 'Alpha project' })).toBeVisible();
		await expect.element(page.getByRole('option', { name: 'Gamma project' })).toBeVisible();
	});
});
