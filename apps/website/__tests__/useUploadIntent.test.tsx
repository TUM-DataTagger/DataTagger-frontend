// @vitest-environment happy-dom

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { Provider as JotaiProvider } from 'jotai';
import { type PropsWithChildren } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EnvProvider } from '@/contexts/EnvContext';
import { useUploadIntent } from '@/uploads/useUploadIntent';
import { $api, openAPIClient } from '@/util/clientFetch';
import { dashboardSnapshotQueryOptions } from '@/util/dashboardSnapshot';
import { processDropItem } from '@/util/processDropItem';
import type * as ProcessDropItemModule from '@/util/processDropItem';

const nuqsState = vi.hoisted(() => ({
	setVersionQueryState: vi.fn(),
}));

const setUpload = vi.fn();
const mockTusUpload = {
	abort: vi.fn(),
	findPreviousUploads: vi.fn(),
	resumeFromPreviousUpload: vi.fn(),
	start: vi.fn(),
};

type TusUploadOptions = {
	onError(error: unknown, upload: typeof mockTusUpload): Promise<void>;
	onProgress(bytesSent: number, bytesTotal: number): void;
	onSuccess(): Promise<void>;
	onUploadUrlAvailable(upload: typeof mockTusUpload): void;
};

vi.mock('use-tus', () => ({
	useTus: () => ({ setUpload }),
}));

vi.mock('@/util/clientFetch', () => ({
	$api: {
		queryOptions: (_method: string, path: string, options?: unknown) => ({
			queryKey: [path, options],
		}),
	},
	openAPIClient: {
		POST: vi.fn(),
	},
}));

vi.mock('@/util/recentActivity', () => ({
	recordRecentProjectUploadActivity: vi.fn(),
}));

vi.mock('@/util/processDropItem', async (importOriginal) => ({
	...(await importOriginal<typeof ProcessDropItemModule>()),
	processDropItem: vi.fn(),
}));

vi.mock('nuqs', () => ({
	parseAsString: {},
	useQueryState: () => [null, nuqsState.setVersionQueryState],
}));

function createWrapper(
	queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
		},
	}),
) {
	return function Wrapper({ children }: PropsWithChildren) {
		return (
			<JotaiProvider>
				<EnvProvider env={{ BASE_API_URL: 'https://api.example.test' } as never}>
					<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
				</EnvProvider>
			</JotaiProvider>
		);
	};
}

describe('useUploadIntent', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		nuqsState.setVersionQueryState.mockClear();
		vi.mocked(openAPIClient.POST).mockReset();
		vi.mocked(openAPIClient.POST).mockResolvedValue({
			data: { pk: 'dataset-1' },
			error: undefined,
			response: new Response(null, { status: 201 }),
		} as never);
		setUpload.mockImplementation((_file: File, options: TusUploadOptions) => {
			options.onUploadUrlAvailable(mockTusUpload);
			options.onProgress(50, 100);
			void options.onSuccess();
		});
	});

	it('starts selected files as draft Uploads and reflects completion in the Upload Queue', async () => {
		const queryClient = new QueryClient();
		const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
		const { result } = renderHook(() => useUploadIntent(), { wrapper: createWrapper(queryClient) });
		const file = new File(['content'], 'report.pdf', { type: 'application/pdf' });

		await act(async () => {
			await result.current.startSelectedCreateUploads({
				destination: { kind: 'draft' },
				files: [file],
			});
		});

		await waitFor(() => {
			expect(result.current.draftUploads).toEqual([
				expect.objectContaining({
					datasetUuid: 'dataset-1',
					error: false,
					filename: 'report.pdf',
					finished: true,
					percentComplete: 100,
				}),
			]);
		});

		expect(openAPIClient.POST).toHaveBeenCalledWith('/api/v1/uploads-dataset/', {
			body: {
				folder: null,
				name: 'report.pdf',
			},
		});
		expect(setUpload).toHaveBeenCalledWith(
			file,
			expect.objectContaining({
				endpoint: 'https://api.example.test/api/v1/uploads-dataset/dataset-1/tus/',
				metadata: expect.objectContaining({
					filename: 'report.pdf',
					filetype: 'application/pdf',
				}),
			}),
		);
		expect(result.current.activeUploadCount).toBe(0);
		expect(invalidateQueries).not.toHaveBeenCalledWith({ queryKey: dashboardSnapshotQueryOptions($api).queryKey });
	});

	it('keeps the relative directory of files selected via a folder picker', async () => {
		const queryClient = new QueryClient();
		const { result } = renderHook(() => useUploadIntent(), { wrapper: createWrapper(queryClient) });
		const file = new File(['content'], 'acqus', { type: '' });
		Object.defineProperty(file, 'webkitRelativePath', { value: '10/pdata/1/acqus' });

		await act(async () => {
			await result.current.startSelectedCreateUploads({
				destination: { kind: 'draft' },
				files: [file],
			});
		});

		expect(setUpload).toHaveBeenCalledWith(
			file,
			expect.objectContaining({
				metadata: expect.objectContaining({
					filename: 'acqus',
					filepath: '10 / pdata / 1',
				}),
			}),
		);
	});

	it('refreshes the Dashboard Snapshot after a dashboard-origin Upload completes', async () => {
		const queryClient = new QueryClient();
		const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
		const { result } = renderHook(() => useUploadIntent(), { wrapper: createWrapper(queryClient) });

		await act(async () => {
			await result.current.startSelectedCreateUploads({
				destination: { kind: 'draft' },
				files: [new File(['content'], 'dashboard.pdf', { type: 'application/pdf' })],
				origin: 'dashboard',
			});
		});

		await waitFor(() => {
			expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: dashboardSnapshotQueryOptions($api).queryKey });
		});
	});

	it('refreshes the Dashboard Snapshot after a dashboard-origin dropped Upload completes', async () => {
		const droppedFile = new File(['dashboard'], 'dashboard.txt', { type: 'text/plain' });
		const dropItem = { kind: 'file', name: 'dashboard.txt' };
		const fileDropItem = {
			name: 'dashboard.txt',
			type: 'text/plain',
			getFile: vi.fn().mockResolvedValue(droppedFile),
		};
		vi.mocked(processDropItem).mockResolvedValueOnce([{ directory: undefined, item: fileDropItem }] as never);
		const queryClient = new QueryClient();
		const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
		const { result } = renderHook(() => useUploadIntent(), { wrapper: createWrapper(queryClient) });

		await act(async () => {
			await result.current.startDroppedCreateUploads({
				destination: { kind: 'draft' },
				items: [dropItem as never],
				origin: 'dashboard',
			});
		});

		await waitFor(() => {
			expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: dashboardSnapshotQueryOptions($api).queryKey });
		});
	});

	it('creates folder Uploads in the current subfolder and recreates the selected folder structure', async () => {
		vi.mocked(openAPIClient.POST).mockResolvedValueOnce({
			data: { pk: 'dataset-folder-1' },
			error: undefined,
			response: new Response(null, { status: 201 }),
		} as never);

		const { result } = renderHook(() => useUploadIntent(), { wrapper: createWrapper() });
		const file = new File(['content'], '1r', { type: '' });
		Object.defineProperty(file, 'webkitRelativePath', { value: '10/pdata/1/1r' });

		await act(async () => {
			await result.current.startSelectedCreateUploads({
				destination: {
					kind: 'folder',
					folderUuid: 'folder-1',
					subfolderUuid: 'subfolder-1',
				},
				files: [file],
			});
		});

		expect(openAPIClient.POST).toHaveBeenCalledWith('/api/v1/uploads-dataset/', {
			body: {
				folder: 'folder-1',
				name: '1r',
				subfolder: 'subfolder-1',
				subfolder_path: '10 / pdata / 1',
			},
		});
	});

	it('starts selected files as folder Uploads and keeps folder context in the Upload Queue', async () => {
		vi.mocked(openAPIClient.POST).mockResolvedValueOnce({
			data: { pk: 'dataset-folder-1' },
			error: undefined,
			response: new Response(null, { status: 201 }),
		} as never);

		const { result } = renderHook(() => useUploadIntent(), { wrapper: createWrapper() });
		const file = new File(['id,name'], 'records.csv', { type: 'text/csv' });

		await act(async () => {
			await result.current.startSelectedCreateUploads({
				destination: {
					kind: 'folder',
					folderName: 'Client Evidence',
					folderUuid: 'folder-1',
					projectUuid: 'project-1',
				},
				files: [file],
			});
		});

		await waitFor(() => {
			expect(result.current.folderUploads).toEqual([
				expect.objectContaining({
					datasetUuid: 'dataset-folder-1',
					error: false,
					filename: 'records.csv',
					finished: true,
					folderName: 'Client Evidence',
					folderUuid: 'folder-1',
					percentComplete: 100,
					projectUuid: 'project-1',
				}),
			]);
		});

		expect(openAPIClient.POST).toHaveBeenCalledWith('/api/v1/uploads-dataset/', {
			body: {
				folder: 'folder-1',
				name: 'records.csv',
				subfolder: null,
				subfolder_path: null,
			},
		});
		expect(setUpload).toHaveBeenCalledWith(
			file,
			expect.objectContaining({
				endpoint: 'https://api.example.test/api/v1/uploads-dataset/dataset-folder-1/tus/',
				metadata: expect.objectContaining({
					filename: 'records.csv',
					filetype: 'text/csv',
				}),
			}),
		);
		expect(result.current.activeUploadCount).toBe(0);
	});

	it('continues a selected create Upload batch when one file fails to initialize', async () => {
		vi.mocked(openAPIClient.POST)
			.mockResolvedValueOnce({
				data: undefined,
				error: { detail: 'Dataset creation failed' },
				response: new Response(null, { status: 400 }),
			} as never)
			.mockResolvedValueOnce({
				data: { pk: 'dataset-after-failure' },
				error: undefined,
				response: new Response(null, { status: 201 }),
			} as never);

		const { result } = renderHook(() => useUploadIntent(), { wrapper: createWrapper() });
		const failedFile = new File(['bad'], 'bad.pdf', { type: 'application/pdf' });
		const uploadedFile = new File(['good'], 'good.pdf', { type: 'application/pdf' });

		await act(async () => {
			await result.current.startSelectedCreateUploads({
				destination: { kind: 'draft' },
				files: [failedFile, uploadedFile],
			});
		});

		await waitFor(() => {
			expect(result.current.draftUploads).toEqual([
				expect.objectContaining({
					error: true,
					filename: 'bad.pdf',
					finished: false,
				}),
				expect.objectContaining({
					datasetUuid: 'dataset-after-failure',
					error: false,
					filename: 'good.pdf',
					finished: true,
				}),
			]);
		});

		expect(setUpload).toHaveBeenCalledTimes(1);
		expect(setUpload).toHaveBeenCalledWith(uploadedFile, expect.any(Object));
	});

	it('creates a failed queue entry for create Upload initialization failures and retries it', async () => {
		vi.mocked(openAPIClient.POST)
			.mockResolvedValueOnce({
				data: undefined,
				error: { detail: 'Dataset creation failed' },
				response: new Response(null, { status: 400 }),
			} as never)
			.mockResolvedValueOnce({
				data: { pk: 'dataset-retry-1' },
				error: undefined,
				response: new Response(null, { status: 201 }),
			} as never);

		const { result } = renderHook(() => useUploadIntent(), { wrapper: createWrapper() });
		const file = new File(['retry'], 'retry.pdf', { type: 'application/pdf' });

		await act(async () => {
			await result.current.startSelectedCreateUploads({
				destination: { kind: 'draft' },
				files: [file],
			});
		});

		await waitFor(() => {
			expect(result.current.draftUploads).toEqual([
				expect.objectContaining({
					error: true,
					filename: 'retry.pdf',
					finished: false,
					percentComplete: 0,
				}),
			]);
		});

		const uploadUuid = result.current.draftUploads[0]!.uuid;

		await act(async () => {
			await result.current.retryUpload(uploadUuid);
		});

		await waitFor(() => {
			expect(result.current.draftUploads).toEqual([
				expect.objectContaining({
					datasetUuid: 'dataset-retry-1',
					error: false,
					filename: 'retry.pdf',
					finished: true,
					percentComplete: 100,
					uuid: uploadUuid,
				}),
			]);
		});

		expect(openAPIClient.POST).toHaveBeenCalledTimes(2);
		expect(setUpload).toHaveBeenCalledWith(
			file,
			expect.objectContaining({
				endpoint: 'https://api.example.test/api/v1/uploads-dataset/dataset-retry-1/tus/',
			}),
		);
	});

	it('starts dropped directory files as draft Uploads with normalized filepath metadata', async () => {
		const droppedFile = new File(['nested'], 'nested.txt', { type: 'text/plain' });
		const dropItem = { kind: 'directory', name: 'project' };
		const fileDropItem = {
			name: 'nested.txt',
			type: 'text/plain',
			getFile: vi.fn().mockResolvedValue(droppedFile),
		};
		vi.mocked(processDropItem).mockResolvedValueOnce([
			{
				directory: 'project / docs',
				item: fileDropItem,
			},
		] as never);

		const { result } = renderHook(() => useUploadIntent(), { wrapper: createWrapper() });

		await act(async () => {
			await result.current.startDroppedCreateUploads({
				destination: { kind: 'draft' },
				items: [dropItem as never],
			});
		});

		await waitFor(() => {
			expect(result.current.draftUploads).toEqual([
				expect.objectContaining({
					directory: 'project / docs',
					datasetUuid: 'dataset-1',
					error: false,
					filename: 'nested.txt',
					finished: true,
					percentComplete: 100,
				}),
			]);
		});

		expect(processDropItem).toHaveBeenCalledWith(dropItem);
		expect(fileDropItem.getFile).toHaveBeenCalled();
		expect(openAPIClient.POST).toHaveBeenCalledWith('/api/v1/uploads-dataset/', {
			body: {
				folder: null,
				name: 'nested.txt',
			},
		});
		expect(setUpload).toHaveBeenCalledWith(
			droppedFile,
			expect.objectContaining({
				metadata: expect.objectContaining({
					filename: 'nested.txt',
					filepath: 'project / docs',
					filetype: 'text/plain',
				}),
			}),
		);
	});

	it('ignores dropped create Uploads when normalization returns no allowed files', async () => {
		const dropItem = { kind: 'directory', name: 'node_modules' };
		vi.mocked(processDropItem).mockResolvedValueOnce([]);

		const { result } = renderHook(() => useUploadIntent(), { wrapper: createWrapper() });

		await act(async () => {
			await result.current.startDroppedCreateUploads({
				destination: { kind: 'draft' },
				items: [dropItem as never],
			});
		});

		expect(processDropItem).toHaveBeenCalledWith(dropItem);
		expect(openAPIClient.POST).not.toHaveBeenCalled();
		expect(setUpload).not.toHaveBeenCalled();
		expect(result.current.draftUploads).toEqual([]);
	});

	it('starts selected files as existing dataset Upload updates and clears selected version on success', async () => {
		const { result } = renderHook(() => useUploadIntent(), { wrapper: createWrapper() });
		const file = new File(['updated'], 'replacement.pdf', { type: 'application/pdf' });

		await act(async () => {
			await result.current.startSelectedUpdateUploads({
				files: [file],
				target: {
					datasetUuid: 'dataset-existing-1',
					folderName: 'Client Evidence',
					folderUuid: 'folder-1',
					projectUuid: 'project-1',
				},
			});
		});

		await waitFor(() => {
			expect(result.current.folderUploads).toEqual([
				expect.objectContaining({
					datasetUuid: 'dataset-existing-1',
					error: false,
					filename: 'replacement.pdf',
					finished: true,
					folderName: 'Client Evidence',
					folderUuid: 'folder-1',
					percentComplete: 100,
					projectUuid: 'project-1',
				}),
			]);
		});

		expect(openAPIClient.POST).not.toHaveBeenCalled();
		expect(setUpload).toHaveBeenCalledWith(
			file,
			expect.objectContaining({
				endpoint: 'https://api.example.test/api/v1/uploads-dataset/dataset-existing-1/tus/',
				metadata: expect.objectContaining({
					filename: 'replacement.pdf',
					filetype: 'application/pdf',
				}),
			}),
		);
		expect(nuqsState.setVersionQueryState).toHaveBeenCalledWith(null);
		expect(result.current.activeUploadCount).toBe(0);
	});

	it('marks update Uploads complete without making post-success side effect failures retryable', async () => {
		nuqsState.setVersionQueryState.mockRejectedValueOnce(new Error('Query state failed'));

		const { result } = renderHook(() => useUploadIntent(), { wrapper: createWrapper() });
		const file = new File(['updated'], 'stale-version.pdf', { type: 'application/pdf' });

		await act(async () => {
			await result.current.startSelectedUpdateUploads({
				files: [file],
				target: {
					datasetUuid: 'dataset-existing-3',
				},
			});
		});

		await waitFor(() => {
			expect(result.current.draftUploads).toEqual([
				expect.objectContaining({
					completionSyncError: true,
					datasetUuid: 'dataset-existing-3',
					error: false,
					filename: 'stale-version.pdf',
					finished: true,
					percentComplete: 100,
				}),
			]);
		});

		await act(async () => {
			await result.current.retryUpload(result.current.draftUploads[0]!.uuid);
		});

		expect(mockTusUpload.start).not.toHaveBeenCalled();
		expect(result.current.activeUploadCount).toBe(0);
	});

	it('starts dropped files as existing dataset Upload updates with normalized filepath metadata', async () => {
		const droppedFile = new File(['updated nested'], 'replacement.txt', { type: 'text/plain' });
		const dropItem = { kind: 'directory', name: 'replacement' };
		const fileDropItem = {
			name: 'replacement.txt',
			type: 'text/plain',
			getFile: vi.fn().mockResolvedValue(droppedFile),
		};
		vi.mocked(processDropItem).mockResolvedValueOnce([
			{
				directory: 'replacement',
				item: fileDropItem,
			},
		] as never);

		const { result } = renderHook(() => useUploadIntent(), { wrapper: createWrapper() });

		await act(async () => {
			await result.current.startDroppedUpdateUploads({
				items: [dropItem as never],
				target: {
					datasetUuid: 'dataset-existing-2',
				},
			});
		});

		await waitFor(() => {
			expect(result.current.draftUploads).toEqual([
				expect.objectContaining({
					directory: 'replacement',
					datasetUuid: 'dataset-existing-2',
					error: false,
					filename: 'replacement.txt',
					finished: true,
					percentComplete: 100,
				}),
			]);
		});

		expect(openAPIClient.POST).not.toHaveBeenCalled();
		expect(setUpload).toHaveBeenCalledWith(
			droppedFile,
			expect.objectContaining({
				endpoint: 'https://api.example.test/api/v1/uploads-dataset/dataset-existing-2/tus/',
				metadata: expect.objectContaining({
					filename: 'replacement.txt',
					filepath: 'replacement',
					filetype: 'text/plain',
				}),
			}),
		);
		expect(nuqsState.setVersionQueryState).toHaveBeenCalledWith(null);
	});

	it('exposes queue actions for draft selection and clearing finished queue items', async () => {
		vi.mocked(openAPIClient.POST)
			.mockResolvedValueOnce({
				data: { pk: 'dataset-draft' },
				error: undefined,
				response: new Response(null, { status: 201 }),
			} as never)
			.mockResolvedValueOnce({
				data: { pk: 'dataset-folder' },
				error: undefined,
				response: new Response(null, { status: 201 }),
			} as never);

		const { result } = renderHook(() => useUploadIntent(), { wrapper: createWrapper() });

		await act(async () => {
			await result.current.startSelectedCreateUploads({
				destination: { kind: 'draft' },
				files: [new File(['draft'], 'draft.pdf', { type: 'application/pdf' })],
			});
			await result.current.startSelectedCreateUploads({
				destination: { kind: 'folder', folderUuid: 'folder-1' },
				files: [new File(['folder'], 'folder.pdf', { type: 'application/pdf' })],
			});
		});

		await waitFor(() => {
			expect(result.current.draftUploads).toHaveLength(1);
			expect(result.current.folderUploads).toHaveLength(1);
		});

		act(() => {
			result.current.setAllDraftUploadsSelected(true);
		});

		expect(result.current.selectedDraftUploads).toEqual([
			expect.objectContaining({
				datasetUuid: 'dataset-draft',
				selected: true,
			}),
		]);

		act(() => {
			result.current.setDraftUploadSelection(new Set());
		});

		expect(result.current.selectedDraftUploads).toEqual([]);

		act(() => {
			result.current.clearFinishedDraftUploads();
		});

		expect(result.current.draftUploads).toEqual([]);
		expect(result.current.folderUploads).toHaveLength(1);

		act(() => {
			result.current.clearFinishedFolderUploads();
		});

		expect(result.current.folderUploads).toEqual([]);
	});

	it('retries errored uploads without exposing upload transport details through queue projections', async () => {
		const previousUpload = { uploadUrl: 'https://uploads.example.test/previous' };
		mockTusUpload.findPreviousUploads.mockResolvedValueOnce([previousUpload]);
		setUpload.mockImplementationOnce((_file: File, options: Record<string, unknown>) => {
			(options.onUploadUrlAvailable as (upload: typeof mockTusUpload) => void)(mockTusUpload);
			void (options.onError as (error: Error, upload: typeof mockTusUpload) => Promise<void>)(
				new Error('Upload failed'),
				mockTusUpload,
			);
		});

		const { result } = renderHook(() => useUploadIntent(), { wrapper: createWrapper() });

		await act(async () => {
			await result.current.startSelectedCreateUploads({
				destination: { kind: 'draft' },
				files: [new File(['draft'], 'errored.pdf', { type: 'application/pdf' })],
			});
		});

		await waitFor(() => {
			expect(result.current.draftUploads).toEqual([
				expect.objectContaining({
					error: true,
					filename: 'errored.pdf',
				}),
			]);
		});

		expect(result.current.draftUploads[0]).not.toHaveProperty('tusUpload');

		await act(async () => {
			await result.current.retryUpload(result.current.draftUploads[0]!.uuid);
		});

		expect(mockTusUpload.findPreviousUploads).toHaveBeenCalled();
		expect(mockTusUpload.resumeFromPreviousUpload).toHaveBeenCalledWith(previousUpload);
		expect(mockTusUpload.start).toHaveBeenCalled();
		expect(result.current.draftUploads[0]).toEqual(
			expect.objectContaining({
				error: false,
			}),
		);
	});

	it('runs update completion side effects when a retried transport upload succeeds', async () => {
		let retryOptions: TusUploadOptions | undefined;
		mockTusUpload.findPreviousUploads.mockResolvedValueOnce([]);
		setUpload.mockImplementationOnce((_file: File, options: TusUploadOptions) => {
			retryOptions = options;
			options.onUploadUrlAvailable(mockTusUpload);
			void options.onError(new Error('Upload failed'), mockTusUpload);
		});

		const { result } = renderHook(() => useUploadIntent(), { wrapper: createWrapper() });
		const file = new File(['retry update'], 'retry-update.pdf', { type: 'application/pdf' });

		await act(async () => {
			await result.current.startSelectedUpdateUploads({
				files: [file],
				target: {
					datasetUuid: 'dataset-existing-retry',
				},
			});
		});

		await waitFor(() => {
			expect(result.current.draftUploads).toEqual([
				expect.objectContaining({
					error: true,
					filename: 'retry-update.pdf',
					finished: false,
				}),
			]);
		});

		const uploadUuid = result.current.draftUploads[0]!.uuid;

		await act(async () => {
			await result.current.retryUpload(uploadUuid);
		});

		expect(mockTusUpload.start).toHaveBeenCalled();

		await act(async () => {
			await retryOptions!.onSuccess();
		});

		await waitFor(() => {
			expect(result.current.draftUploads).toEqual([
				expect.objectContaining({
					completionSyncError: false,
					datasetUuid: 'dataset-existing-retry',
					error: false,
					filename: 'retry-update.pdf',
					finished: true,
					percentComplete: 100,
					uuid: uploadUuid,
				}),
			]);
		});
		expect(nuqsState.setVersionQueryState).toHaveBeenCalledWith(null);
	});

	it('returns retried transport uploads to error state when the retry fails asynchronously', async () => {
		let retryOptions: TusUploadOptions | undefined;
		mockTusUpload.findPreviousUploads.mockResolvedValueOnce([]);
		setUpload.mockImplementationOnce((_file: File, options: TusUploadOptions) => {
			retryOptions = options;
			options.onUploadUrlAvailable(mockTusUpload);
			void options.onError(new Error('Upload failed'), mockTusUpload);
		});

		const { result } = renderHook(() => useUploadIntent(), { wrapper: createWrapper() });

		await act(async () => {
			await result.current.startSelectedCreateUploads({
				destination: { kind: 'draft' },
				files: [new File(['draft'], 'retry-async-fails.pdf', { type: 'application/pdf' })],
			});
		});

		await waitFor(() => {
			expect(result.current.draftUploads).toEqual([
				expect.objectContaining({
					error: true,
					filename: 'retry-async-fails.pdf',
					finished: false,
				}),
			]);
		});

		const uploadUuid = result.current.draftUploads[0]!.uuid;

		await act(async () => {
			await result.current.retryUpload(uploadUuid);
		});

		expect(result.current.draftUploads).toEqual([
			expect.objectContaining({
				error: false,
				uuid: uploadUuid,
			}),
		]);

		await act(async () => {
			await retryOptions!.onError(new Error('Retry upload failed'), mockTusUpload);
		});

		await waitFor(() => {
			expect(result.current.draftUploads).toEqual([
				expect.objectContaining({
					error: true,
					filename: 'retry-async-fails.pdf',
					finished: false,
					percentComplete: 0,
					uploadSpeed: 0,
					uuid: uploadUuid,
				}),
			]);
		});
	});

	it('keeps the same queue entry in error state when retry start fails synchronously', async () => {
		mockTusUpload.findPreviousUploads.mockResolvedValueOnce([]);
		mockTusUpload.start.mockImplementationOnce(() => {
			throw new Error('Retry start failed');
		});
		setUpload.mockImplementationOnce((_file: File, options: Record<string, unknown>) => {
			(options.onUploadUrlAvailable as (upload: typeof mockTusUpload) => void)(mockTusUpload);
			void (options.onError as (error: Error, upload: typeof mockTusUpload) => Promise<void>)(
				new Error('Upload failed'),
				mockTusUpload,
			);
		});

		const { result } = renderHook(() => useUploadIntent(), { wrapper: createWrapper() });

		await act(async () => {
			await result.current.startSelectedCreateUploads({
				destination: { kind: 'draft' },
				files: [new File(['draft'], 'retry-fails.pdf', { type: 'application/pdf' })],
			});
		});

		const uploadUuid = result.current.draftUploads[0]!.uuid;

		await act(async () => {
			await result.current.retryUpload(uploadUuid);
		});

		expect(result.current.draftUploads).toEqual([
			expect.objectContaining({
				error: true,
				filename: 'retry-fails.pdf',
				uuid: uploadUuid,
			}),
		]);
	});
});
