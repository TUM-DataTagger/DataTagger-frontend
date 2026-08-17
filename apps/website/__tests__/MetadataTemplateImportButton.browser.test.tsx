import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { MetadataTemplateImportButton } from '@/components/metadata-template/MetadataTemplateImportDialog';

async function renderImportButton() {
	return render(
		<QueryClientProvider client={new QueryClient()}>
			<MetadataTemplateImportButton scope={{ kind: 'global' }} />
		</QueryClientProvider>,
	);
}

describe('MetadataTemplateImportButton', () => {
	it('is available', async () => {
		const screen = await renderImportButton();

		await expect.element(screen.getByRole('button', { name: 'Import' })).toBeInTheDocument();
	});
});
