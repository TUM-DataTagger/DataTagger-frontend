// @vitest-environment happy-dom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useFirstTimeFlag } from '@/hooks/useFirstTimeFlag';
import { useLocalStorageBoolean } from '@/hooks/useLocalStorageBoolean';

vi.mock('@/hooks/useLocalStorageBoolean', () => ({
	useLocalStorageBoolean: vi.fn(),
}));

const mockedUseLocalStorageBoolean = vi.mocked(useLocalStorageBoolean);

describe('useFirstTimeFlag', () => {
	beforeEach(() => {
		mockedUseLocalStorageBoolean.mockReset();
	});

	it('defaults to first-time when storage value is undefined', () => {
		mockedUseLocalStorageBoolean.mockReturnValue({
			value: undefined,
			setValue: vi.fn(),
		});

		const { result } = renderHook(() => useFirstTimeFlag('project'));

		expect(result.current.isFirstTime).toBe(true);
	});

	it('markCompleted writes false to local storage state', () => {
		const setValue = vi.fn();
		mockedUseLocalStorageBoolean.mockReturnValue({
			value: true,
			setValue,
		});

		const { result } = renderHook(() => useFirstTimeFlag('folder'));
		act(() => {
			result.current.markCompleted();
		});

		expect(setValue).toHaveBeenCalledWith(false);
	});

	it('reset writes true to local storage state', () => {
		const setValue = vi.fn();
		mockedUseLocalStorageBoolean.mockReturnValue({
			value: false,
			setValue,
		});

		const { result } = renderHook(() => useFirstTimeFlag('metadata-template'));
		act(() => {
			result.current.reset();
		});

		expect(setValue).toHaveBeenCalledWith(true);
	});

	it('routes each flag kind to the expected canonical and legacy keys', () => {
		mockedUseLocalStorageBoolean.mockReturnValue({
			value: true,
			setValue: vi.fn(),
		});

		renderHook(() => useFirstTimeFlag('project'));
		renderHook(() => useFirstTimeFlag('folder'));
		renderHook(() => useFirstTimeFlag('metadata-template'));

		expect(mockedUseLocalStorageBoolean.mock.calls[0]?.[0]).toEqual({
			canonicalKey: 'onboarding:is-first-time-project',
			legacyKeys: ['isFirstTimeProject'],
		});
		expect(mockedUseLocalStorageBoolean.mock.calls[1]?.[0]).toEqual({
			canonicalKey: 'onboarding:is-first-time-folder',
			legacyKeys: ['isFirstTimeFolder'],
		});
		expect(mockedUseLocalStorageBoolean.mock.calls[2]?.[0]).toEqual({
			canonicalKey: 'onboarding:is-first-time-metadata-template',
			legacyKeys: ['isFirstTimeMetadataTemplate'],
		});
	});
});
