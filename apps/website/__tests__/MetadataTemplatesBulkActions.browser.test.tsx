import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { MetadataTemplatesBulkActions } from '@/app/(main)/(metadata-templates)/metadata-templates/MetadataTemplatesBulkActions';

const nuqsState = vi.hoisted(() => ({
	queryStates: { bulk_edit: false, selected: [] as string[] } as Record<string, unknown>,
	setQueryStates: vi.fn(async (_nextValue: Record<string, unknown>) => {}),
}));

vi.mock('nuqs', async () => {
	const React = await import('react');
	return {
		parseAsArrayOf: () => ({ withDefault: (defaultValue: string[]) => ({ defaultValue }) }),
		parseAsBoolean: { withDefault: (defaultValue: boolean) => ({ defaultValue }) },
		parseAsString: { withDefault: (defaultValue: string) => ({ defaultValue }) },
		useQueryStates: (schema: Record<string, { readonly defaultValue?: unknown }>) => {
			const initialValue = Object.fromEntries(
				Object.entries(schema).map(([key, parser]) => [key, nuqsState.queryStates[key] ?? parser.defaultValue ?? null]),
			);
			const [state, setState] = React.useState<Record<string, unknown>>(initialValue);
			return [
				state,
				async (nextValue: Record<string, unknown>) => {
					void nuqsState.setQueryStates(nextValue);
					setState((current) => ({ ...current, ...nextValue }));
				},
			] as const;
		},
	};
});

vi.mock('@/components/metadata-template/MetadataTemplateExportDialog', () => ({
	MetadataTemplateExportDialog: () => null,
}));

describe('MetadataTemplatesBulkActions', () => {
	beforeEach(() => {
		nuqsState.queryStates = { bulk_edit: false, selected: [] };
		nuqsState.setQueryStates.mockClear();
	});

	it('clears selection when bulk actions are switched off without page-wide selection controls', async () => {
		nuqsState.queryStates = { bulk_edit: true, selected: ['template-1'] };
		const screen = await render(<MetadataTemplatesBulkActions currentPageUuids={['template-1', 'template-2']} />);

		await expect.element(screen.getByRole('button', { name: 'Select all on current page' })).not.toBeInTheDocument();
		await expect.element(screen.getByRole('button', { name: 'Clear current page selection' })).not.toBeInTheDocument();
		await screen.getByText('Bulk actions').click();
		expect(nuqsState.setQueryStates).toHaveBeenLastCalledWith({ bulk_edit: false, selected: [] });
	});

	it('keeps the bulk actions menu available while disabling export with no selection', async () => {
		const screen = await render(<MetadataTemplatesBulkActions currentPageUuids={['template-1']} />);

		await screen.getByText('Bulk actions').click();
		await expect.element(screen.getByRole('button', { name: 'More bulk actions' })).toBeEnabled();
		await screen.getByRole('button', { name: 'More bulk actions' }).click();
		await expect.element(screen.getByRole('menuitem', { name: 'Export selected metadata templates' })).toBeDisabled();
	});
});
