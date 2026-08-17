// @vitest-environment happy-dom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useExitTemplateBulkMode } from '@/hooks/useExitTemplateBulkMode';

const testState = vi.hoisted(() => ({
	queryStates: {} as Record<string, unknown>,
	setQueryStates: vi.fn(async () => {}),
}));

vi.mock('nuqs', () => ({
	parseAsBoolean: {
		withDefault: (defaultValue: boolean) => ({ defaultValue }),
	},
	useQueryStates: (schema: Record<string, { readonly defaultValue?: unknown }>) => {
		const values = Object.fromEntries(
			Object.entries(schema).map(([key, parser]) => [key, testState.queryStates[key] ?? parser.defaultValue ?? null]),
		);
		return [values, testState.setQueryStates] as const;
	},
}));

describe('useExitTemplateBulkMode', () => {
	beforeEach(() => {
		testState.queryStates = { template_bulk_edit: true };
		testState.setQueryStates.mockClear();
	});

	it('flips template_bulk_edit to false in a single setQueryStates call', async () => {
		const { result } = renderHook(() => useExitTemplateBulkMode());

		await act(async () => {
			await result.current();
		});

		expect(testState.setQueryStates).toHaveBeenCalledTimes(1);
		expect(testState.setQueryStates).toHaveBeenCalledWith({ template_bulk_edit: false });
	});
});
