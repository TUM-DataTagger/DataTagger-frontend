import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { SearchFilterChoiceValueControl } from '@/app/(main)/search/SearchFilterChoiceValueControl';
import type { ChoiceFieldType, MetadataKeyScope } from '@/util/filterContext';
import type { SearchFilterValue } from '@/util/globalSearch';

const apiState = vi.hoisted(() => ({ getMock: vi.fn() }));

vi.mock('@/util/clientFetch', async () => {
	const { default: createReactQueryClient } = await import('openapi-react-query');
	const openAPIClient = { GET: (...args: unknown[]) => apiState.getMock(...args) };
	return { openAPIClient, $api: createReactQueryClient(openAPIClient as never) };
});

const scope: MetadataKeyScope = {
	projectIds: ['project-1'],
	folderIds: [],
	datasetIds: [],
	templateIds: [],
	projectNames: [],
	folderNames: [],
	datasetNames: [],
	templateNames: [],
};

function Harness(props: {
	readonly fieldType: ChoiceFieldType;
	readonly initialValue: SearchFilterValue;
	readonly keys?: readonly string[];
	readonly nearViewportBottom?: boolean;
	readonly operator: string;
	readonly scope?: MetadataKeyScope;
}) {
	const [value, setValue] = useState(props.initialValue);
	const queryClient = useMemo(() => new QueryClient({ defaultOptions: { queries: { retry: false } } }), []);
	return (
		<QueryClientProvider client={queryClient}>
			<div style={props.nearViewportBottom ? { position: 'fixed', bottom: 0, left: 0, width: '360px' } : undefined}>
				<SearchFilterChoiceValueControl
					fieldType={props.fieldType}
					keys={props.keys ?? []}
					onValueChange={setValue}
					operator={props.operator}
					scope={props.scope}
					value={value}
				/>
				<output data-testid="choice-value-state">{JSON.stringify(value)}</output>
				<button type="button">After choice control</button>
			</div>
		</QueryClientProvider>
	);
}

const suggestionGroups = [
	{
		field_type: 'TAG',
		key: 'labels',
		metadata_template_field_id: 'field-1',
		metadata_template_id: 'version-1',
		metadata_template_name: 'Research template',
		metadata_template_container_name: 'Research choices',
		options: ['Urgent', 'Shared'],
		source: 'project',
		source_id: 'project-1',
		source_name: 'Project one',
	},
	{
		field_type: 'TAG',
		key: 'labels',
		metadata_template_field_id: 'field-2',
		metadata_template_id: 'version-2',
		metadata_template_name: 'Archive template',
		metadata_template_container_name: 'Archive choices',
		options: ['Shared', 'Reviewed'],
		source: 'template',
		source_id: 'template-2',
		source_name: 'Archive choices',
	},
];

describe('SearchFilterChoiceValueControl', () => {
	beforeEach(() => apiState.getMock.mockReset());

	it('supports keyless free entry for a single selection without fetching suggestions', async () => {
		const screen = await render(<Harness fieldType="SELECTION" initialValue="" operator="is" />);
		const input = screen.getByRole('combobox', { name: 'Choice value' });
		await input.fill('Ad hoc value');
		await expect.element(input).toHaveValue('Ad hoc value');
		expect(apiState.getMock).not.toHaveBeenCalled();
	});

	it('fetches suggestions lazily with bounded keys, type, and optional scope', async () => {
		apiState.getMock.mockResolvedValue({
			data: { results: suggestionGroups },
			error: null,
			response: new Response(null),
		});
		const screen = await render(
			<Harness fieldType="TAG" initialValue={[]} keys={['labels', 'other']} operator="contains_any" scope={scope} />,
		);
		expect(apiState.getMock).not.toHaveBeenCalled();

		await screen.getByRole('combobox', { name: 'Search and add choice values' }).click();
		await expect
			.element(page.getByRole('group', { name: /labels · research choices · project project one/i }))
			.toBeVisible();
		expect(apiState.getMock).toHaveBeenCalledWith(
			'/api/v1/search/metadata-choice-options/',
			expect.objectContaining({
				params: { query: { field_type: 'TAG', key: ['labels', 'other'], project_id: ['project-1'] } },
			}),
		);
	});

	it('keeps duplicate suggestions visible until their literal is added as one selected tag', async () => {
		apiState.getMock.mockResolvedValue({
			data: { results: suggestionGroups },
			error: null,
			response: new Response(null),
		});
		const screen = await render(
			<Harness fieldType="TAG" initialValue={[]} keys={['labels']} operator="contains_any" />,
		);
		await screen.getByRole('combobox', { name: 'Search and add choice values' }).click();
		const sharedOption = page
			.getByRole('group', { name: /labels · research choices · project project one/i })
			.getByRole('option', { name: 'Shared' });
		await expect.element(sharedOption).toBeVisible();
		await sharedOption.click({ force: true });

		await expect.poll(() => screen.baseElement.querySelector('[data-choice-value="Shared"]')).toBeTruthy();
		await expect
			.poll(() =>
				Array.from(document.querySelectorAll('[role="option"]')).some((option) => option.textContent === 'Shared'),
			)
			.toBe(false);
		await page
			.getByRole('group', { name: /archive choices/i })
			.getByRole('option', { name: 'Reviewed' })
			.click({ force: true });
		await expect.poll(() => screen.baseElement.querySelector('[data-choice-value="Reviewed"]')).toBeTruthy();
	});

	it('does not treat a highlighted suggestion as a custom literal on Enter', async () => {
		apiState.getMock.mockResolvedValue({
			data: { results: suggestionGroups },
			error: null,
			response: new Response(null),
		});
		const screen = await render(
			<Harness fieldType="TAG" initialValue={[]} keys={['labels']} operator="contains_any" />,
		);
		const input = screen.getByRole('combobox', { name: 'Search and add choice values' });
		await input.click();
		await input.fill('Sha');
		const sharedOption = page.getByRole('group', { name: /research choices/i }).getByRole('option', { name: 'Shared' });
		await expect.element(sharedOption).toBeVisible();
		await userEvent.keyboard('{ArrowDown}{Enter}');

		expect(screen.baseElement.querySelector('[data-choice-value="Sha"]')).toBeNull();
		await expect.poll(() => screen.baseElement.querySelector('[data-choice-value="Shared"]')).toBeTruthy();
	});

	it('navigates and commits a suggestion with the keyboard in development mode', async () => {
		apiState.getMock.mockResolvedValue({
			data: { results: suggestionGroups },
			error: null,
			response: new Response(null),
		});
		const screen = await render(
			<Harness fieldType="TAG" initialValue={[]} keys={['labels']} operator="contains_any" />,
		);
		const input = screen.getByRole('combobox', { name: 'Search and add choice values' });
		await input.click();
		await expect
			.element(page.getByRole('group', { name: /research choices/i }).getByRole('option', { name: 'Shared' }))
			.toBeVisible();
		await userEvent.keyboard('{ArrowDown}');
		await expect.poll(() => input.element().getAttribute('aria-activedescendant')).toBeTruthy();
		const activeOption = document.querySelector(
			`#${CSS.escape(input.element().getAttribute('aria-activedescendant')!)}`,
		);
		expect(activeOption?.textContent).toContain('Urgent');
		await userEvent.keyboard('{Enter}');
		await expect.poll(() => screen.baseElement.querySelector('[data-choice-value="Urgent"]')).toBeTruthy();
	});

	it('keeps the typeahead popover in the viewport', async () => {
		apiState.getMock.mockResolvedValue({
			data: { results: suggestionGroups },
			error: null,
			response: new Response(null),
		});
		const screen = await render(
			<Harness fieldType="TAG" initialValue={[]} keys={['labels']} nearViewportBottom operator="contains_any" />,
		);
		const input = screen.getByRole('combobox', { name: 'Search and add choice values' });
		await input.click();
		const listbox = page.getByRole('listbox', { name: 'Choice values' });
		await expect.element(listbox).toBeVisible();

		expect.soft(listbox.element().getBoundingClientRect().bottom <= window.innerHeight).toBe(true);
		expect(screen.baseElement.querySelector('button[aria-label="Toggle choice values"]')).toBeNull();
	});

	it('matches the input width and shared dropdown offset', async () => {
		apiState.getMock.mockResolvedValue({
			data: { results: suggestionGroups },
			error: null,
			response: new Response(null),
		});
		const screen = await render(
			<div className="w-[360px]">
				<Harness fieldType="TAG" initialValue={[]} keys={['labels']} operator="contains_any" />
			</div>,
		);
		const input = screen.getByRole('combobox', { name: 'Search and add choice values' });
		await input.click();
		const listbox = page.getByRole('listbox', { name: 'Choice values' });
		await expect.element(listbox).toBeVisible();

		await expect
			.poll(() => {
				const popover = listbox.element().closest<HTMLElement>('[data-placement="bottom"]');
				if (!popover) return false;
				const inputRect = input.element().getBoundingClientRect();
				const popoverRect = popover.getBoundingClientRect();
				return (
					Math.abs(popoverRect.width - inputRect.width) < 1 && Math.abs(popoverRect.top - inputRect.bottom - 8) < 1
				);
			})
			.toBe(true);
	});

	it('preserves surrounding whitespace in legacy search literals', async () => {
		const screen = await render(<Harness fieldType="TAG" initialValue={[]} operator="contains_any" />);
		const input = screen.getByRole('combobox', { name: 'Search and add choice values' });
		await input.fill(' legacy ');
		await userEvent.keyboard('{Enter}');

		await expect
			.poll(() => screen.baseElement.querySelector('[data-choice-value]')?.getAttribute('data-choice-value'))
			.toBe(' legacy ');
	});

	it('keeps a freely entered tag after it is unchecked and lets the user remove it completely', async () => {
		const screen = await render(<Harness fieldType="TAG" initialValue={[]} operator="contains_any" />);
		const input = screen.getByRole('combobox', { name: 'Search and add choice values' });
		await input.fill('Candidate');
		await userEvent.keyboard('{Enter}');
		await expect.poll(() => screen.baseElement.querySelector('[data-choice-value="Candidate"]')).toBeTruthy();
		const candidateTag = screen.baseElement.querySelector('[data-choice-value="Candidate"]');
		expect(candidateTag).not.toBeNull();
		expect(candidateTag?.hasAttribute('data-selected')).toBe(true);

		await page.getByRole('gridcell', { name: 'Candidate Remove Candidate' }).click();
		await expect.poll(() => candidateTag?.hasAttribute('data-selected')).toBe(false);
		await expect
			.element(screen.getByTestId('choice-value-state'))
			.toHaveTextContent('{"selected":[],"unselected":["Candidate"]}');
		await expect.element(screen.getByRole('button', { name: 'Remove Candidate' })).toBeVisible();

		await screen.getByRole('button', { name: 'Remove Candidate' }).click();
		await expect.poll(() => screen.baseElement.querySelector('[data-choice-value="Candidate"]')).toBeNull();
		await expect.element(screen.getByTestId('choice-value-state')).toHaveTextContent('{"selected":[],"unselected":[]}');
	});

	it('shows every candidate as a removable selectable tag', async () => {
		const screen = await render(
			<Harness
				fieldType="MULTI_SELECTION"
				initialValue={{ selected: ['First', 'Third'], unselected: ['Second'] }}
				operator="is_exactly"
			/>,
		);
		await expect.element(screen.getByRole('button', { name: 'Remove First' })).toBeVisible();
		await expect.element(screen.getByRole('button', { name: 'Remove Second' })).toBeVisible();
		await expect.element(screen.getByRole('button', { name: 'Remove Third' })).toBeVisible();
		expect(screen.baseElement.textContent).not.toContain('+1');
	});

	it('keeps tag order stable when selection state changes', async () => {
		const screen = await render(
			<Harness
				fieldType="MULTI_SELECTION"
				initialValue={{ selected: ['1', '2'], unselected: [] }}
				operator="contains_any"
			/>,
		);
		const tagOrder = () =>
			Array.from(screen.baseElement.querySelectorAll<HTMLElement>('[data-choice-value]'), (tag) =>
				tag.getAttribute('data-choice-value'),
			);
		const secondTag = page.getByRole('gridcell', { name: '2 Remove 2' });

		expect(tagOrder()).toEqual(['1', '2']);
		await secondTag.click();
		await expect.poll(tagOrder).toEqual(['1', '2']);
		await secondTag.click();
		await expect.poll(tagOrder).toEqual(['1', '2']);
		await expect
			.element(screen.getByTestId('choice-value-state'))
			.toHaveTextContent('{"selected":["1","2"],"unselected":[]}');
	});

	it('shows a local suggestion error while free entry remains usable', async () => {
		apiState.getMock.mockResolvedValue({
			data: undefined,
			error: { detail: 'Unavailable' },
			response: new Response(null, { status: 503 }),
		});
		const screen = await render(
			<Harness fieldType="MULTI_SELECTION" initialValue={[]} keys={['status']} operator="contains_all" />,
		);
		const input = screen.getByRole('combobox', { name: 'Search and add choice values' });
		await input.click();
		await expect.element(page.getByText(/configured choices could not be loaded/i)).toBeVisible();
		await input.fill('Manual');
		await userEvent.keyboard('{Enter}');
		await expect.poll(() => screen.baseElement.querySelector('[data-choice-value="Manual"]')).toBeTruthy();
	});
});
