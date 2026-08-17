// @vitest-environment happy-dom

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	getFeatureFlagValue,
	isFeatureFlagEnabled,
	useFeatureFlags,
	type FeatureFlagsData,
} from '@/hooks/useFeatureFlags';

function withQueryClient(children: ReactNode) {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
		},
	});

	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useFeatureFlags helpers', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('falls back to definition default when value is missing', () => {
		const flagsData: FeatureFlagsData = {
			definitions: {
				user_settings_enabled: {
					defaultValue: 1,
				},
			},
			values: {},
		};

		expect(getFeatureFlagValue(flagsData, 'user_settings_enabled')).toBe(1);
		expect(getFeatureFlagValue(flagsData, 'missing')).toBeUndefined();
	});

	it("treats only true, 1, and '1' as enabled", () => {
		const flagsData: FeatureFlagsData = {
			definitions: {},
			values: {
				bool_true: true,
				number_one: 1,
				string_one: '1',
				string_true: 'true',
				number_zero: 0,
				string_zero: '0',
			},
		};

		expect(isFeatureFlagEnabled(flagsData, 'bool_true')).toBe(true);
		expect(isFeatureFlagEnabled(flagsData, 'number_one')).toBe(true);
		expect(isFeatureFlagEnabled(flagsData, 'string_one')).toBe(true);
		expect(isFeatureFlagEnabled(flagsData, 'string_true')).toBe(false);
		expect(isFeatureFlagEnabled(flagsData, 'number_zero')).toBe(false);
		expect(isFeatureFlagEnabled(flagsData, 'string_zero')).toBe(false);
		expect(isFeatureFlagEnabled(undefined, 'missing')).toBe(false);
	});
});

describe('useFeatureFlags', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('throws when /flags returns non-2xx', async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: false,
			status: 503,
		});
		vi.stubGlobal('fetch', fetchMock);

		const { result } = renderHook(() => useFeatureFlags(), {
			wrapper: ({ children }) => withQueryClient(children),
		});

		await waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		expect(result.current.error?.message).toBe('Failed to fetch flags (503)');
		expect(fetchMock).toHaveBeenCalledWith('/flags');
	});
});
