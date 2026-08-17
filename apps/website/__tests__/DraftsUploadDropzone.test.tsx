// @vitest-environment happy-dom

import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DraftsUploadDropzone } from '@/components/upload-assistant/DraftsUploadDropzone';

const uploadIntentState = vi.hoisted(() => ({
	startDroppedCreateUploads: vi.fn(),
	startSelectedCreateUploads: vi.fn(),
}));

vi.mock('usehooks-ts', () => ({
	useMediaQuery: () => false,
}));

vi.mock('@/uploads/useUploadIntent', () => ({
	useUploadIntent: () => uploadIntentState,
}));

describe('DraftsUploadDropzone', () => {
	beforeEach(() => {
		uploadIntentState.startDroppedCreateUploads.mockReset();
		uploadIntentState.startSelectedCreateUploads.mockReset();
	});

	it('starts a dashboard-origin Upload when a file is dropped on the dashboard Upload area', async () => {
		const screen = render(<DraftsUploadDropzone origin="dashboard" />);
		const instruction = screen.getByText('Drag and drop files to upload them or');
		const dropzone = instruction.closest('.global-dropzone-border');
		const dataTransfer = new DataTransfer();
		dataTransfer.items.add(new File(['dashboard'], 'dashboard.txt', { type: 'text/plain' }));
		dataTransfer.effectAllowed = 'all';
		const createDragEvent = (type: string) => {
			const event = new DragEvent(type, { bubbles: true });
			Object.defineProperty(event, 'dataTransfer', { value: dataTransfer });
			return event;
		};

		expect(dropzone).not.toBeNull();
		dropzone!.dispatchEvent(createDragEvent('dragenter'));
		dropzone!.dispatchEvent(createDragEvent('dragover'));
		dropzone!.dispatchEvent(createDragEvent('drop'));

		await vi.waitFor(() => {
			expect(uploadIntentState.startDroppedCreateUploads).toHaveBeenCalledWith({
				destination: { kind: 'draft' },
				items: expect.arrayContaining([expect.objectContaining({ kind: 'file', name: 'dashboard.txt' })]),
				origin: 'dashboard',
			});
		});
	});
});
