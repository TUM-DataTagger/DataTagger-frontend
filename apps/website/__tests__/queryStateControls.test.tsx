// @vitest-environment happy-dom

import { act, fireEvent, render, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useFilterState } from '@/components/query-controls/FilterMenu';
import { useSortByState } from '@/components/query-controls/SortByMenu';
import { ViewSwitch } from '@/components/query-controls/ViewSwitch';

const testState = vi.hoisted(() => ({
	queryState: {} as Record<string, string | null | undefined>,
	queryStates: {} as Record<string, unknown>,
	setQueryState: vi.fn(async () => {}),
	setQueryStates: vi.fn(async () => {}),
}));

vi.mock('nuqs', () => ({
	parseAsBoolean: {},
	parseAsInteger: {
		withDefault: (defaultValue: number) => ({ defaultValue }),
	},
	parseAsString: {
		withDefault: (defaultValue: string) => ({ defaultValue }),
	},
	useQueryState: (queryKey: string, parser?: { readonly defaultValue?: string }) => [
		testState.queryState[queryKey] ?? parser?.defaultValue ?? null,
		testState.setQueryState,
	],
	useQueryStates: (schema: Record<string, { readonly defaultValue?: unknown }>) => {
		const values = Object.fromEntries(
			Object.entries(schema).map(([key, parser]) => [key, testState.queryStates[key] ?? parser.defaultValue ?? null]),
		);
		return [values, testState.setQueryStates] as const;
	},
}));

vi.mock('@/components/ui/RadioGroup', () => ({
	RadioGroup: (props: { readonly children: ReactNode; onChange?(value: string): void; readonly value?: string }) => (
		<div data-value={props.value} data-testid="radio-group">
			<button onClick={() => props.onChange?.('grid')} type="button">
				grid
			</button>
			<button onClick={() => props.onChange?.('table')} type="button">
				table
			</button>
			{props.children}
		</div>
	),
	Radio: (props: { readonly children: ReactNode; readonly value: string }) => (
		<div data-value={props.value}>{props.children}</div>
	),
}));

describe('query state controls', () => {
	beforeEach(() => {
		testState.queryState = {};
		testState.queryStates = {};
		testState.setQueryState.mockClear();
		testState.setQueryStates.mockClear();
	});

	it('useSortByState updates selection and query param when sorting changes', async () => {
		testState.queryState.sort = 'name';

		const { result } = renderHook(() => useSortByState({ defaultSort: 'name' }));
		expect(Array.from(result.current.selected)).toEqual(['name']);

		await act(async () => {
			await result.current.handleSort('last_worked_on');
		});

		expect(Array.from(result.current.selected)).toEqual(['last_worked_on']);
		expect(testState.setQueryState).toHaveBeenCalledWith('last_worked_on');
	});

	it('useFilterState handles empty, reset, single, and multi selection query behavior', async () => {
		testState.queryStates = { status: null, reset_filters: null };

		const { result } = renderHook(() =>
			useFilterState({
				label: 'Status',
				options: { active: 'Active', archived: 'Archived' },
				queryKey: 'status',
			}),
		);

		await act(async () => {
			await result.current.handleSelectionChange(new Set());
		});
		expect(testState.setQueryStates).toHaveBeenLastCalledWith({ status: null, reset_filters: null });
		expect(Array.from(result.current.selected)).toEqual([]);

		await act(async () => {
			await result.current.handleSelectionChange(new Set(['reset']));
		});
		expect(testState.setQueryStates).toHaveBeenLastCalledWith({ status: null, reset_filters: null });
		expect(Array.from(result.current.selected)).toEqual([]);

		await act(async () => {
			await result.current.handleSelectionChange(new Set(['active']));
		});
		expect(testState.setQueryStates).toHaveBeenLastCalledWith({ status: 'active', reset_filters: null });
		expect(Array.from(result.current.selected)).toEqual(['active']);

		await act(async () => {
			await result.current.handleSelectionChange(new Set(['active', 'archived']));
		});
		expect(testState.setQueryStates).toHaveBeenLastCalledWith({ status: null, reset_filters: null });
		expect(Array.from(result.current.selected)).toEqual(['active', 'archived']);
	});

	it('useFilterState clears local selection when reset_filters is set in query state', async () => {
		testState.queryStates = { status: 'active', reset_filters: true };

		const { result } = renderHook(() =>
			useFilterState({
				label: 'Status',
				options: { active: 'Active', archived: 'Archived' },
				queryKey: 'status',
			}),
		);

		await waitFor(() => {
			expect(testState.setQueryStates).toHaveBeenCalledWith({ status: null, reset_filters: null });
		});
		expect(Array.from(result.current.selected)).toEqual([]);
	});

	it('ViewSwitch writes { view } by default and { page: 1, view } when resetPageOnChange is true', async () => {
		testState.queryStates = { page: 3, view: 'grid' };

		const defaultView = render(<ViewSwitch />);
		fireEvent.click(defaultView.getByRole('button', { name: 'table' }));
		await waitFor(() => {
			expect(testState.setQueryStates).toHaveBeenCalledWith({ view: 'table' });
		});

		testState.setQueryStates.mockClear();
		defaultView.unmount();

		const resetPageView = render(<ViewSwitch resetPageOnChange />);
		fireEvent.click(resetPageView.getByRole('button', { name: 'table' }));
		await waitFor(() => {
			expect(testState.setQueryStates).toHaveBeenCalledWith({ page: 1, view: 'table' });
		});
	});
});
