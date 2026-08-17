import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { SortByMenu, useSortByState } from '@/components/query-controls/SortByMenu';
import { ViewSwitch } from '@/components/query-controls/ViewSwitch';

const nuqsState = vi.hoisted(() => ({
	queryState: {
		sort: 'name',
	} as Record<string, string | null | undefined>,
	queryStates: {
		page: 3,
		view: 'grid',
	} as Record<string, unknown>,
	setQueryStateCalls: [] as { readonly queryKey: string; readonly value: string | null }[],
	setQueryStatesCalls: [] as Record<string, unknown>[],
}));

vi.mock('nuqs', () => ({
	parseAsInteger: {
		withDefault: (defaultValue: number) => ({ defaultValue }),
	},
	parseAsString: {
		withDefault: (defaultValue: string) => ({ defaultValue }),
	},
	useQueryState: (queryKey: string, parser?: { readonly defaultValue?: string }) => [
		nuqsState.queryState[queryKey] ?? parser?.defaultValue ?? null,
		async (value: string | null) => {
			nuqsState.queryState[queryKey] = value;
			nuqsState.setQueryStateCalls.push({ queryKey, value });
		},
	],
	useQueryStates: (schema: Record<string, { readonly defaultValue?: unknown }>) => [
		Object.fromEntries(
			Object.entries(schema).map(([key, parser]) => [key, nuqsState.queryStates[key] ?? parser.defaultValue ?? null]),
		),
		async (nextValue: Record<string, unknown>) => {
			nuqsState.setQueryStatesCalls.push(nextValue);
			nuqsState.queryStates = {
				...nuqsState.queryStates,
				...nextValue,
			};
		},
	],
}));

function SortByMenuHarness() {
	const sortState = useSortByState({ defaultSort: 'name' });

	return (
		<SortByMenu
			options={{
				name: 'Name',
				last_worked_on: 'Last worked on',
			}}
			sortState={sortState}
		/>
	);
}

async function clickMenuOption(label: string) {
	const radioOption = page.getByRole('menuitemradio', { name: label });
	if (radioOption.query() !== null) {
		await radioOption.click();
		return;
	}

	await page.getByRole('menuitem', { name: label }).click();
}

describe('query controls browser behavior', () => {
	beforeEach(() => {
		nuqsState.queryState = { sort: 'name' };
		nuqsState.queryStates = { page: 3, view: 'grid' };
		nuqsState.setQueryStateCalls = [];
		nuqsState.setQueryStatesCalls = [];
	});

	it('SortByMenu opens and updates selected label using real menu interactions', async () => {
		const screen = await render(<SortByMenuHarness />);
		const trigger = screen.getByRole('button', { name: 'Sort by menu' });

		await expect.element(trigger).toHaveTextContent('Name');

		await trigger.click();
		await clickMenuOption('Last worked on');

		await expect.element(trigger).toHaveTextContent('Last worked on');
		expect(nuqsState.setQueryStateCalls).toContainEqual({
			queryKey: 'sort',
			value: 'last_worked_on',
		});
	});

	it('ViewSwitch writes expected query payloads for default and reset-page modes', async () => {
		const defaultViewScreen = await render(<ViewSwitch />);
		defaultViewScreen
			.getByRole('radio', { name: 'Table view' })
			.element()
			.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

		expect(nuqsState.setQueryStatesCalls).toContainEqual({
			view: 'table',
		});

		nuqsState.setQueryStatesCalls = [];
		nuqsState.queryStates = { page: 3, view: 'grid' };
		await defaultViewScreen.unmount();

		const resetPageScreen = await render(<ViewSwitch resetPageOnChange />);
		resetPageScreen
			.getByRole('radio', { name: 'Table view' })
			.element()
			.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

		expect(nuqsState.setQueryStatesCalls).toContainEqual({
			page: 1,
			view: 'table',
		});
	});
});
