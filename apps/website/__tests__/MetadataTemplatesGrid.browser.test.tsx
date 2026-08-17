import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { MetadataTemplatesGrid } from '@/app/(main)/(metadata-templates)/metadata-templates/MetadataTemplatesGrid';
import { MetadataTemplatesTable } from '@/app/(main)/(metadata-templates)/metadata-templates/MetadataTemplatesTable';

vi.mock('nuqs', () => ({
	parseAsArrayOf: () => ({ withDefault: (defaultValue: string[]) => ({ defaultValue }) }),
	parseAsBoolean: { withDefault: (defaultValue: boolean) => ({ defaultValue }) },
	parseAsString: { withDefault: (defaultValue: string) => ({ defaultValue }) },
	useQueryStates: () => [{ bulk_edit: true, selected: [] }, async () => {}] as const,
}));

vi.mock('@/hooks/useCurrentUser', () => ({
	useCurrentUser: () => ({
		currentUserData: { is_global_metadata_template_admin: true },
	}),
}));

describe('MetadataTemplatesGrid', () => {
	it('keeps the authorized create CTA disabled and out of bulk selection', async () => {
		const screen = await render(<MetadataTemplatesGrid data={[]} />);

		await expect.element(screen.getByLabelText('Create metadata template')).toBeDisabled();
		await expect.element(screen.getByRole('checkbox')).not.toBeInTheDocument();
	});

	it('keeps the authorized table create CTA visible but disabled during bulk actions', async () => {
		const screen = await render(<MetadataTemplatesTable data={[]} />);

		await expect.element(screen.getByRole('link', { name: 'Create metadata template' })).toBeDisabled();
	});
});
