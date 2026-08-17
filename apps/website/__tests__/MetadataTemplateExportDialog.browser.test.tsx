import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { MetadataTemplateExportDialog } from '@/components/metadata-template/MetadataTemplateExportDialog';
import type * as ToastModule from '@/components/ui/Toast';
import { ToastType } from '@/components/ui/Toast';

const apiState = vi.hoisted(() => ({ getMock: vi.fn(), postMock: vi.fn() }));
const toastState = vi.hoisted(() => ({ add: vi.fn() }));

vi.mock('@/util/clientFetch', () => ({
	openAPIClient: {
		GET: async (...args: unknown[]) => ({
			data: await apiState.getMock(...args),
			error: null,
			response: new Response(null, { status: 200 }),
		}),
		POST: (...args: unknown[]) => apiState.postMock(...args),
	},
}));

vi.mock('@/components/ui/Toast', async () => {
	const actual = await vi.importActual<typeof ToastModule>('@/components/ui/Toast');
	return { ...actual, globalToastQueue: { add: toastState.add } };
});

function createQueryClient() {
	return new QueryClient({ defaultOptions: { mutations: { retry: false }, queries: { retry: false } } });
}

describe('MetadataTemplateExportDialog', () => {
	beforeEach(() => {
		apiState.getMock.mockReset();
		apiState.postMock.mockReset();
		toastState.add.mockReset();
	});

	it('downloads, closes, and resets when the export finishes', async () => {
		apiState.postMock.mockResolvedValueOnce({
			data: { pk: 'job-1', status: 'SCHEDULED', download_url: '' },
			error: null,
			response: new Response(null, { status: 202 }),
		});
		apiState.getMock.mockResolvedValue({
			pk: 'job-1',
			status: 'FINISHED',
			download_url: '/api/v1/metadata-template-export/job-1/download/',
		});
		const onOpenChange = vi.fn();
		const originalCreateElement = document.createElement.bind(document);
		const click = vi.fn();
		const remove = vi.fn();
		const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName, options) => {
			const element = originalCreateElement(tagName, options);
			if (tagName === 'a') {
				element.click = click;
				element.remove = remove;
			}

			return element;
		});

		try {
			const screen = await render(
				<QueryClientProvider client={createQueryClient()}>
					<MetadataTemplateExportDialog containerUuids={['template-1']} isOpen onOpenChange={onOpenChange} />
				</QueryClientProvider>,
			);

			await screen.getByRole('button', { name: 'Export' }).click();
			await vi.waitFor(() => expect(click).toHaveBeenCalledOnce());

			expect(remove).toHaveBeenCalledOnce();
			expect(onOpenChange).toHaveBeenCalledWith(false);
			expect(toastState.add).toHaveBeenCalledWith(
				expect.objectContaining({ message: 'Metadata template export is ready.', type: ToastType.Success }),
				expect.anything(),
			);
		} finally {
			createElementSpy.mockRestore();
		}
	});

	it('stops polling on close, explains email delivery, and reopens cleanly', async () => {
		apiState.postMock.mockResolvedValueOnce({
			data: { pk: 'job-1', status: 'SCHEDULED', download_url: '' },
			error: null,
			response: new Response(null, { status: 202 }),
		});
		apiState.getMock.mockResolvedValue({ pk: 'job-1', status: 'IN_PROGRESS', download_url: '' });

		function ReopenHarness() {
			const [isOpen, setIsOpen] = useState(true);

			return (
				<>
					<button onClick={() => setIsOpen(true)} type="button">
						Open export
					</button>
					<MetadataTemplateExportDialog containerUuids={['template-1']} isOpen={isOpen} onOpenChange={setIsOpen} />
				</>
			);
		}

		const screen = await render(
			<QueryClientProvider client={createQueryClient()}>
				<ReopenHarness />
			</QueryClientProvider>,
		);

		await screen.getByRole('button', { name: 'Export', exact: true }).click();
		await vi.waitFor(() => expect(apiState.getMock).toHaveBeenCalledOnce());
		await screen.getByRole('button', { name: 'Cancel' }).click();
		expect(toastState.add).toHaveBeenCalledWith(
			expect.objectContaining({
				message: 'Export started. You will receive an email when it is ready.',
				type: ToastType.TextOnly,
			}),
			expect.anything(),
		);

		await screen.getByRole('button', { name: 'Open export' }).click();
		await expect.element(screen.getByRole('button', { name: 'Export', exact: true })).toBeEnabled();
		expect(apiState.getMock).toHaveBeenCalledOnce();
	});

	it('retries the immutable submitted container selection after its parent clears', async () => {
		apiState.postMock
			.mockResolvedValueOnce({
				data: { pk: 'job-1', status: 'SCHEDULED', download_url: '' },
				error: null,
				response: new Response(null, { status: 202 }),
			})
			.mockResolvedValueOnce({
				data: { pk: 'job-2', status: 'SCHEDULED', download_url: '' },
				error: null,
				response: new Response(null, { status: 202 }),
			});
		apiState.getMock
			.mockResolvedValueOnce({ pk: 'job-1', status: 'ERROR', download_url: '', error_message: 'Try again.' })
			.mockResolvedValue({ pk: 'job-2', status: 'IN_PROGRESS', download_url: '' });

		function BulkHarness() {
			const [selected, setSelected] = useState(['template-1', 'template-2']);
			return (
				<MetadataTemplateExportDialog
					containerUuids={selected}
					isOpen
					onJobCreated={() => setSelected([])}
					onOpenChange={() => {}}
				/>
			);
		}

		const screen = await render(
			<QueryClientProvider client={createQueryClient()}>
				<BulkHarness />
			</QueryClientProvider>,
		);

		await expect.element(screen.getByText('Export 2 selected metadata templates to a ZIP file.')).toBeInTheDocument();
		await screen.getByRole('button', { name: 'Export' }).click();
		await expect.element(screen.getByText('Try again.')).toBeInTheDocument();
		await screen.getByRole('button', { name: 'Retry export' }).click();

		await vi.waitFor(() => expect(apiState.postMock).toHaveBeenCalledTimes(2));
		expect(apiState.postMock.mock.calls[0]).toEqual(apiState.postMock.mock.calls[1]);
		expect(apiState.postMock).toHaveBeenCalledWith('/api/v1/metadata-template-export/', {
			body: { metadata_template_containers: ['template-1', 'template-2'] },
		});
	});

	it('identifies an individual metadata template and the fixed archive contents', async () => {
		const screen = await render(
			<QueryClientProvider client={createQueryClient()}>
				<MetadataTemplateExportDialog
					containerName="Portable template"
					containerUuids={['template-1']}
					isOpen
					onOpenChange={() => {}}
				/>
			</QueryClientProvider>,
		);

		await expect.element(screen.getByText('Export “Portable template” to a ZIP file.')).toBeInTheDocument();
		await expect
			.element(screen.getByText(/The ZIP contains one JSON file per selected metadata template/))
			.toBeInTheDocument();
	});
});
