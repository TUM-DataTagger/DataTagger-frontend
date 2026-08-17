import { evaluate, getProviderData } from 'flags/next';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/flags/route';

const mockedFlags = vi.hoisted(() => ({
	userSettingsEnabledFlag: {
		key: 'user_settings_enabled',
	},
}));

vi.mock('@/flags', () => ({
	developerToolbarFlags: mockedFlags,
}));

vi.mock('flags/next', () => ({
	evaluate: vi.fn(),
	getProviderData: vi.fn(),
}));

describe('GET /flags', () => {
	beforeEach(() => {
		vi.mocked(evaluate).mockResolvedValue([true]);
		vi.mocked(getProviderData).mockReturnValue({
			definitions: {
				user_settings_enabled: { description: 'User settings' },
			},
			hints: [],
		});
	});

	it('returns provider data and keyed flag values', async () => {
		const response = await GET();
		const body = (await response.json()) as Record<string, unknown>;

		expect(evaluate).toHaveBeenCalledWith([mockedFlags.userSettingsEnabledFlag]);
		expect(getProviderData).toHaveBeenCalled();
		expect(body).toMatchObject({
			definitions: {
				user_settings_enabled: { description: 'User settings' },
			},
			values: {
				user_settings_enabled: true,
			},
		});
	});
});
