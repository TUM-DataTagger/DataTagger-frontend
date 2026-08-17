import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { DraftsSortByMenu } from '@/app/(main)/drafts/DraftsSortByMenu';

const nuqsState = vi.hoisted(() => ({
	queryState: { sort: '-creation_date' } as Record<string, string | null | undefined>,
	setQueryStateCalls: [] as { readonly queryKey: string; readonly value: string | null }[],
}));

vi.mock('nuqs', () => ({
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
}));

async function clickMenuOption(label: string) {
	const radioOption = page.getByRole('menuitemradio', { name: label });
	if (radioOption.query() !== null) {
		await radioOption.click();
		return;
	}

	await page.getByRole('menuitem', { name: label }).click();
}

describe('DraftsSortByMenu', () => {
	beforeEach(() => {
		nuqsState.queryState = { sort: '-creation_date' };
		nuqsState.setQueryStateCalls = [];
	});

	it('requests the earliest expiry first when sorting closer to auto-delete', async () => {
		const screen = await render(<DraftsSortByMenu />);
		await screen.getByRole('button', { name: 'Sort by menu' }).click();
		await clickMenuOption('Closer to auto-delete');

		expect(nuqsState.setQueryStateCalls).toContainEqual({
			queryKey: 'sort',
			value: 'expiry_date',
		});
	});
});
