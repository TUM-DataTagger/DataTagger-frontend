// @vitest-environment happy-dom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GlobalUploadAssistantDraftsTab } from '@/components/upload-assistant/GlobalUploadAssistantDraftsTab';
import { GlobalUploadAssistantFoldersTab } from '@/components/upload-assistant/GlobalUploadAssistantFoldersTab';
import type { UploadQueueItem } from '@/uploads/useUploadIntent';

const uploadIntent = vi.hoisted(() => ({
	clearFinishedDraftUploads: vi.fn(),
	clearFinishedFolderUploads: vi.fn(),
	draftUploads: [] as UploadQueueItem[],
	folderUploads: [] as UploadQueueItem[],
	retryUpload: vi.fn(),
	selectedDraftUploads: [] as UploadQueueItem[],
	setAllDraftUploadsSelected: vi.fn(),
	setDraftUploadSelection: vi.fn(),
}));

vi.mock('@/uploads/useUploadIntent', () => ({
	useUploadIntent: () => uploadIntent,
}));

vi.mock('usehooks-ts', () => ({
	useMediaQuery: () => false,
}));

vi.mock('@/components/Metadata', () => ({
	MetadataAssignModal: () => null,
}));

vi.mock('@/components/icons/FileUploadEmpty', () => ({
	FileUploadEmpty: () => null,
}));

vi.mock('@/components/icons/FolderUploadEmpty', () => ({
	FolderUploadEmpty: () => null,
}));

vi.mock('@/components/ui/Button', () => ({
	Button: ({
		children,
		onPress,
		...props
	}: {
		children: React.ReactNode;
		onPress?(): Promise<void> | void;
		readonly 'aria-label'?: string;
	}) => (
		<button aria-label={props['aria-label']} onClick={() => void onPress?.()} type="button">
			{children}
		</button>
	),
}));

vi.mock('@/components/ui/Checkbox', () => ({
	Checkbox: ({ onChange, ...props }: { onChange?(isSelected: boolean): void; readonly 'aria-label': string }) => (
		<button aria-label={props['aria-label']} onClick={() => onChange?.(true)} type="button">
			Select all
		</button>
	),
}));

vi.mock('@/components/ui/GridList', () => ({
	GridList: ({
		children,
		onSelectionChange,
	}: {
		children: React.ReactNode;
		onSelectionChange?(keys: Set<string>): void;
	}) => (
		<div>
			<button onClick={() => onSelectionChange?.(new Set(['draft-upload-1']))} type="button">
				Select row
			</button>
			{children}
		</div>
	),
	GridListItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/Modal', () => ({
	Modal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/ProgressBar', () => ({
	ProgressBar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	ProgressBarTrack: () => null,
}));

vi.mock('@/components/ui/Scrollbars', () => ({
	Scrollbars: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/Sidebar', () => ({
	useSidebar: () => ({ setOpen: vi.fn() }),
}));

vi.mock('@/components/ui/TagGroup', () => ({
	Tag: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
	TagGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('GlobalUploadAssistant upload actions', () => {
	afterEach(() => {
		cleanup();
	});

	beforeEach(() => {
		vi.clearAllMocks();
		uploadIntent.draftUploads = [];
		uploadIntent.folderUploads = [];
		uploadIntent.selectedDraftUploads = [];
	});

	it('routes draft assistant selection, clear, and retry through Upload module actions', () => {
		uploadIntent.draftUploads = [
			{
				datasetUuid: 'dataset-draft',
				error: true,
				filename: 'draft.pdf',
				finished: false,
				percentComplete: 50,
				uploadSpeed: 0,
				uuid: 'draft-upload-1',
			},
		];

		render(<GlobalUploadAssistantDraftsTab />);

		fireEvent.click(screen.getByRole('button', { name: 'Select all draft files' }));
		expect(uploadIntent.setAllDraftUploadsSelected).toHaveBeenCalledWith(true);

		fireEvent.click(screen.getByRole('button', { name: 'Select row' }));
		expect(uploadIntent.setDraftUploadSelection).toHaveBeenCalledWith(new Set(['draft-upload-1']));

		fireEvent.click(screen.getByRole('button', { name: 'Retry upload' }));
		expect(uploadIntent.retryUpload).toHaveBeenCalledWith('draft-upload-1');

		fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
		expect(uploadIntent.clearFinishedDraftUploads).toHaveBeenCalled();
	});

	it('routes folder assistant clear and retry through Upload module actions', () => {
		uploadIntent.folderUploads = [
			{
				datasetUuid: 'dataset-folder',
				error: true,
				filename: 'folder.pdf',
				finished: false,
				folderName: 'Evidence',
				folderUuid: 'folder-1',
				percentComplete: 50,
				projectUuid: 'project-1',
				uploadSpeed: 0,
				uuid: 'folder-upload-1',
			},
		];

		render(<GlobalUploadAssistantFoldersTab />);

		fireEvent.click(screen.getByRole('button', { name: 'Retry upload' }));
		expect(uploadIntent.retryUpload).toHaveBeenCalledWith('folder-upload-1');

		fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
		expect(uploadIntent.clearFinishedFolderUploads).toHaveBeenCalled();
	});
});
