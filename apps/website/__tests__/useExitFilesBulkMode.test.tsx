// @vitest-environment happy-dom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useExitFilesBulkMode } from '@/hooks/useExitFilesBulkMode';

const testState = vi.hoisted(() => ({
	queryStates: {} as Record<string, unknown>,
	setQueryStates: vi.fn(async () => {}),
}));

vi.mock('nuqs', () => ({
	parseAsArrayOf: () => ({
		withDefault: (defaultValue: unknown[]) => ({ defaultValue }),
	}),
	parseAsBoolean: {
		withDefault: (defaultValue: boolean) => ({ defaultValue }),
	},
	parseAsString: {
		withDefault: (defaultValue: string) => ({ defaultValue }),
	},
	useQueryStates: (schema: Record<string, { readonly defaultValue?: unknown }>) => {
		const values = Object.fromEntries(
			Object.entries(schema).map(([key, parser]) => [key, testState.queryStates[key] ?? parser.defaultValue ?? null]),
		);
		return [values, testState.setQueryStates] as const;
	},
}));

describe('useExitFilesBulkMode', () => {
	beforeEach(() => {
		testState.queryStates = { bulk_edit: true, selected: ['file-1', 'file-2'] };
		testState.setQueryStates.mockClear();
	});

	it('clears bulk_edit and selected in a single setQueryStates call', async () => {
		const { result } = renderHook(() => useExitFilesBulkMode());

		await act(async () => {
			await result.current();
		});

		expect(testState.setQueryStates).toHaveBeenCalledTimes(1);
		expect(testState.setQueryStates).toHaveBeenCalledWith({ bulk_edit: false, selected: [] });
	});
});
