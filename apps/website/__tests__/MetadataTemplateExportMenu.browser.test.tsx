import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { MetadataTemplateContainerMoreMenu } from '@/app/(main)/(metadata-templates)/metadata-templates/[metadataTemplateContainerUuid]/MetadataTemplateContainerMoreMenu';

const viewState = vi.hoisted(() => ({ version: null as string | null }));

vi.mock('@tanstack/react-query', () => ({
	useQueryClient: () => ({ invalidateQueries: vi.fn(async () => {}) }),
	useSuspenseQueries: () => [
		{ data: { locked: true } },
		{ data: { name: 'Portable template', latest_metadata_template: { pk: 'latest-version' } } },
	],
}));

vi.mock('jotai', () => ({ useAtom: () => [null, vi.fn()] }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('nuqs', () => ({
	parseAsString: {},
	useQueryState: () => [viewState.version, vi.fn()],
}));
vi.mock('@/components/ui/Sidebar', () => ({ useSidebar: () => ({ setOpen: vi.fn() }) }));
vi.mock('@/hooks/useMetadataTemplatePermissions', () => ({
	useMetadataTemplatePermissions: () => ({
		isFolderAdmin: false,
		isGlobalMetadataTemplateAdmin: false,
		isProjectMetadataTemplateAdmin: false,
	}),
}));
vi.mock('@/stores/sideSheet', () => ({
	SideSheetMode: { MetadataTemplateVersionHistory: 'history' },
	sideSheetModeAtom: {},
	sideSheetSelectedMetadataTemplateContainerAtom: {},
}));
vi.mock('@/util/clientFetch', () => ({
	$api: { queryOptions: () => ({ queryKey: [] }) },
	openAPIClient: { GET: vi.fn(), POST: vi.fn() },
}));
vi.mock('@/components/metadata-template/MetadataTemplateContainer', () => ({
	MetadataTemplateContainerEditLockDialog: () => null,
}));
vi.mock('@/components/metadata-template/MetadataTemplateVersionHistory', () => ({
	MetadataTemplateVersionHistoryCloseIndicator: () => <span>Viewing history</span>,
	MetadataTemplateVersionHistoryExitDialog: () => null,
}));
vi.mock('@/components/metadata-template/MetadataTemplateExportDialog', () => ({
	MetadataTemplateExportDialog: (props: { containerName?: string; containerUuids: readonly string[] }) => (
		<span>{`${props.containerName}:${props.containerUuids.join(',')}`}</span>
	),
}));
vi.mock(
	'@/app/(main)/(metadata-templates)/metadata-templates/[metadataTemplateContainerUuid]/MetadataTemplateContainerMoreMenuEditNameDialog',
	() => ({ MetadataTemplateContainerMoreMenuEditNameDialog: () => null }),
);

describe('MetadataTemplateContainerMoreMenu export visibility', () => {
	it('keeps Export available for a locked template to a view-only user', async () => {
		viewState.version = null;
		const screen = await render(<MetadataTemplateContainerMoreMenu metadataTemplateContainerUuid="template-1" />);

		await expect.element(screen.getByRole('button', { name: 'More menu' })).toBeEnabled();
		await screen.getByRole('button', { name: 'More menu' }).click();
		await expect.element(screen.getByLabelText('Export metadata template')).toBeInTheDocument();
		await expect.element(screen.getByText('Portable template:template-1')).toBeInTheDocument();
	});

	it('does not expose Export while a historical version is selected', async () => {
		viewState.version = 'historical-version';
		const screen = await render(<MetadataTemplateContainerMoreMenu metadataTemplateContainerUuid="template-1" />);

		await expect.element(screen.getByRole('button', { name: 'More menu' })).not.toBeInTheDocument();
		await expect.element(screen.getByText('Viewing history')).toBeInTheDocument();
	});
});
