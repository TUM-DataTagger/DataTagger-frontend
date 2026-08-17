import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { ExportJobDialog } from '@/components/ExportJobDialog';
import type * as ToastModule from '@/components/ui/Toast';
import { ToastType } from '@/components/ui/Toast';
import { EXPORT_TYPES } from '@/util/exportJobs';

const apiState = vi.hoisted(() => ({
	getMock: vi.fn(),
	postMock: vi.fn(),
}));

const toastState = vi.hoisted(() => ({
	add: vi.fn(),
}));

vi.mock('@/util/clientFetch', () => ({
	$api: {
		queryOptions: (_method: string, path: string, options?: { readonly params?: unknown }, queryOptions?: object) => ({
			...queryOptions,
			queryKey: [path, options?.params ?? null],
			queryFn: () => apiState.getMock(path, options),
		}),
	},
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

	return {
		...actual,
		globalToastQueue: {
			add: toastState.add,
		},
	};
});

function createQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
				queryFn: ({ queryKey }) => apiState.getMock(queryKey),
			},
			mutations: { retry: false },
		},
	});
}

describe('ExportJobDialog', () => {
	beforeEach(() => {
		apiState.getMock.mockReset();
		apiState.postMock.mockReset();
		toastState.add.mockReset();
	});

	it('creates a backend export job with full export defaults', async () => {
		apiState.postMock.mockResolvedValueOnce({
			data: { pk: 'job-1', status: 'SCHEDULED', download_url: '' },
			error: null,
			response: new Response(null, { status: 202 }),
		});
		apiState.getMock.mockResolvedValue({ pk: 'job-1', status: 'SCHEDULED', download_url: '' });

		const screen = await render(
			<QueryClientProvider client={createQueryClient()}>
				<ExportJobDialog
					exportType={EXPORT_TYPES.UploadsDataset}
					isOpen
					onOpenChange={() => {}}
					title="Export dataset"
					uuids={['dataset-1']}
				/>
			</QueryClientProvider>,
		);

		await screen.getByRole('button', { name: 'Export', exact: true }).click();

		await vi.waitFor(() => {
			expect(apiState.postMock).toHaveBeenCalledWith('/api/v1/export/', {
				body: {
					export_type: 'uploads.uploadsdataset',
					uuids: ['dataset-1'],
					metadata_format: 'json',
					include_uploads_version_file: true,
					include_uploads_version_file_metadata: true,
				},
			});
		});
		await expect.element(screen.getByText('Preparing export...')).toBeInTheDocument();
	});

	it('keeps the dataset selection when job creation fails', async () => {
		apiState.postMock.mockResolvedValueOnce({
			data: null,
			error: { detail: 'Could not start export.' },
			response: new Response(null, { status: 400 }),
		});
		const onJobCreated = vi.fn();
		const screen = await render(
			<QueryClientProvider client={createQueryClient()}>
				<ExportJobDialog
					description="Export 2 selected datasets to a zip file."
					exportType={EXPORT_TYPES.UploadsDataset}
					isOpen
					onJobCreated={onJobCreated}
					onOpenChange={() => {}}
					title="Export selected datasets"
					uuids={['dataset-1', 'dataset-2']}
				/>
			</QueryClientProvider>,
		);

		await screen.getByRole('button', { name: 'Export' }).click();
		await expect.element(screen.getByText('Could not start export.')).toBeInTheDocument();
		expect(onJobCreated).not.toHaveBeenCalled();
		await expect.element(screen.getByText('Export 2 selected datasets to a zip file.')).toBeInTheDocument();
	});

	it('prevents empty exports and hides metadata format when metadata is excluded', async () => {
		const screen = await render(
			<QueryClientProvider client={createQueryClient()}>
				<ExportJobDialog
					exportType={EXPORT_TYPES.UploadsVersion}
					isOpen
					onOpenChange={() => {}}
					title="Export current version"
					uuids={['version-1']}
				/>
			</QueryClientProvider>,
		);

		await expect.element(screen.getByText('JSON')).toBeInTheDocument();
		await screen.getByText('Include metadata').click();
		await expect.element(screen.getByText('JSON')).not.toBeInTheDocument();
		await screen.getByText('Include files').click();

		await expect.element(screen.getByText('Select files, metadata, or both before exporting.')).toBeInTheDocument();
		await expect.element(screen.getByRole('button', { name: 'Export' })).toBeDisabled();
		expect(apiState.postMock).not.toHaveBeenCalled();
	});

	it('downloads from the backend download_url when the job finishes', async () => {
		apiState.postMock.mockResolvedValueOnce({
			data: { pk: 'job-1', status: 'SCHEDULED', download_url: '' },
			error: null,
			response: new Response(null, { status: 202 }),
		});
		apiState.getMock.mockResolvedValue({
			pk: 'job-1',
			status: 'FINISHED',
			download_url: '/api/v1/export/job-1/download/',
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
					<ExportJobDialog
						exportType={EXPORT_TYPES.Project}
						isOpen
						onOpenChange={onOpenChange}
						title="Export project"
						uuids={['project-1']}
					/>
				</QueryClientProvider>,
			);

			await screen.getByRole('button', { name: 'Export' }).click();

			await vi.waitFor(() => {
				expect(click).toHaveBeenCalledOnce();
			});

			expect(remove).toHaveBeenCalledOnce();
			expect(onOpenChange).toHaveBeenCalledWith(false);
			expect(toastState.add).toHaveBeenCalledWith(
				expect.objectContaining({ message: 'Export is ready.', type: ToastType.Success }),
				expect.anything(),
			);
		} finally {
			createElementSpy.mockRestore();
		}
	});

	it('keeps the submitted selection stable when bulk mode clears and retries the same export', async () => {
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
			.mockResolvedValue({ pk: 'job-2', status: 'SCHEDULED', download_url: '' });

		function BulkExportHarness() {
			const [selected, setSelected] = useState(['dataset-1', 'dataset-2']);

			return (
				<ExportJobDialog
					description={`Export ${selected.length} selected datasets to a zip file.`}
					exportType={EXPORT_TYPES.UploadsDataset}
					isOpen
					onJobCreated={() => setSelected([])}
					onOpenChange={() => {}}
					title="Export selected datasets"
					uuids={selected}
				/>
			);
		}

		const screen = await render(
			<QueryClientProvider client={createQueryClient()}>
				<BulkExportHarness />
			</QueryClientProvider>,
		);

		await screen.getByRole('button', { name: 'Export' }).click();
		await expect.element(screen.getByText('Export 2 selected datasets to a zip file.')).toBeInTheDocument();
		await expect.element(screen.getByText('Try again.')).toBeInTheDocument();
		await screen.getByRole('button', { name: 'Retry export' }).click();

		await vi.waitFor(() => {
			expect(apiState.postMock).toHaveBeenCalledTimes(2);
		});
		expect(apiState.postMock.mock.calls[0]).toEqual(apiState.postMock.mock.calls[1]);
	});

	it('stops tracking a running job when closed and reopens with a clean export', async () => {
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
					<ExportJobDialog
						exportType={EXPORT_TYPES.UploadsDataset}
						isOpen={isOpen}
						onOpenChange={setIsOpen}
						title="Export dataset"
						uuids={['dataset-1']}
					/>
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
});
