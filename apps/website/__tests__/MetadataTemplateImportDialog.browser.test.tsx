import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { MetadataTemplateImportDialog } from '@/components/metadata-template/MetadataTemplateImportDialog';
import type * as ToastModule from '@/components/ui/Toast';
import { ToastType } from '@/components/ui/Toast';

const apiState = vi.hoisted(() => ({ postMock: vi.fn() }));
const toastState = vi.hoisted(() => ({ add: vi.fn() }));

vi.mock('@/util/clientFetch', () => ({
	$api: {
		queryOptions: (_method: string, path: string, options?: unknown) => ({ queryKey: [path, options ?? null] }),
	},
	openAPIClient: {
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

function selectFile(input: HTMLInputElement, file: File) {
	const dataTransfer = new DataTransfer();
	dataTransfer.items.add(file);
	Object.defineProperty(input, 'files', { configurable: true, value: dataTransfer.files });
	input.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('MetadataTemplateImportDialog', () => {
	beforeEach(() => {
		apiState.postMock.mockReset();
		toastState.add.mockReset();
	});

	it('imports one JSON file into the resolved project scope and reports the backend name', async () => {
		apiState.postMock.mockResolvedValue({
			data: { pk: 'template-1', name: 'Imported template (1)' },
			error: null,
			response: new Response(null, { status: 201 }),
		});
		const onOpenChange = vi.fn();
		const queryClient = createQueryClient();
		const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
		const screen = await render(
			<QueryClientProvider client={queryClient}>
				<MetadataTemplateImportDialog
					isOpen
					onOpenChange={onOpenChange}
					scope={{ kind: 'project', projectUuid: 'project-1' }}
				/>
			</QueryClientProvider>,
		);

		selectFile(
			screen.getByLabelText('Metadata template JSON file').element() as HTMLInputElement,
			new File(['{"name":"Imported template"}'], 'template.json', { type: 'application/json' }),
		);
		await expect.element(screen.getByText('template.json')).toBeInTheDocument();
		await screen.getByRole('button', { name: 'Import' }).click();

		await vi.waitFor(() => expect(apiState.postMock).toHaveBeenCalledOnce());
		const [path, request] = apiState.postMock.mock.calls[0] as [string, { body: FormData }];
		expect(path).toBe('/api/v1/metadata-template-container/import/');
		expect((request.body.get('file') as File).name).toBe('template.json');
		expect(request.body.get('assigned_to_content_type')).toBe('projects.project');
		expect(request.body.get('assigned_to_object_id')).toBe('project-1');
		expect(invalidateQueries).toHaveBeenCalledWith({
			queryKey: ['/api/v1/project/{id}/metadata-template-container-pool/', { params: { path: { id: 'project-1' } } }],
		});
		expect(onOpenChange).toHaveBeenCalledWith(false);
		expect(toastState.add).toHaveBeenCalledWith(
			expect.objectContaining({
				message: 'Imported metadata template “Imported template (1)”.',
				type: ToastType.Success,
			}),
			expect.anything(),
		);
	});

	it('omits both scope fields for a global import', async () => {
		apiState.postMock.mockResolvedValue({
			data: { pk: 'template-1', name: 'Global template' },
			error: null,
			response: new Response(null, { status: 201 }),
		});
		const screen = await render(
			<QueryClientProvider client={createQueryClient()}>
				<MetadataTemplateImportDialog isOpen onOpenChange={() => {}} scope={{ kind: 'global' }} />
			</QueryClientProvider>,
		);

		selectFile(
			screen.getByLabelText('Metadata template JSON file').element() as HTMLInputElement,
			new File(['{"name":"Global template"}'], 'global.json', { type: 'application/json' }),
		);
		await screen.getByRole('button', { name: 'Import' }).click();
		await vi.waitFor(() => expect(apiState.postMock).toHaveBeenCalledOnce());

		const request = apiState.postMock.mock.calls[0]?.[1] as { body: FormData };
		expect(request.body.has('assigned_to_content_type')).toBe(false);
		expect(request.body.has('assigned_to_object_id')).toBe(false);
	});

	it('sends both folder scope fields together', async () => {
		apiState.postMock.mockResolvedValue({
			data: { pk: 'template-1', name: 'Folder template' },
			error: null,
			response: new Response(null, { status: 201 }),
		});
		const queryClient = createQueryClient();
		const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
		const screen = await render(
			<QueryClientProvider client={queryClient}>
				<MetadataTemplateImportDialog
					isOpen
					onOpenChange={() => {}}
					scope={{ kind: 'folder', folderUuid: 'folder-1', projectUuid: 'project-1' }}
				/>
			</QueryClientProvider>,
		);

		selectFile(
			screen.getByLabelText('Metadata template JSON file').element() as HTMLInputElement,
			new File(['{"name":"Folder template"}'], 'folder.json', { type: 'application/json' }),
		);
		await screen.getByRole('button', { name: 'Import' }).click();
		await vi.waitFor(() => expect(apiState.postMock).toHaveBeenCalledOnce());

		const request = apiState.postMock.mock.calls[0]?.[1] as { body: FormData };
		expect(request.body.get('assigned_to_content_type')).toBe('folders.folder');
		expect(request.body.get('assigned_to_object_id')).toBe('folder-1');
		expect(invalidateQueries).toHaveBeenCalledWith({
			queryKey: ['/api/v1/folder/{id}/metadata-template-container-pool/', { params: { path: { id: 'folder-1' } } }],
		});
	});

	it('shows backend validation errors and retries after selecting a replacement file', async () => {
		apiState.postMock
			.mockResolvedValueOnce({
				data: null,
				error: { error: 'Referenced global metadata field does not exist.' },
				response: new Response(null, { status: 400 }),
			})
			.mockResolvedValueOnce({
				data: { pk: 'template-1', name: 'Replacement template' },
				error: null,
				response: new Response(null, { status: 201 }),
			});
		const onOpenChange = vi.fn();
		const screen = await render(
			<QueryClientProvider client={createQueryClient()}>
				<MetadataTemplateImportDialog isOpen onOpenChange={onOpenChange} scope={{ kind: 'global' }} />
			</QueryClientProvider>,
		);
		const input = screen.getByLabelText('Metadata template JSON file').element() as HTMLInputElement;

		selectFile(input, new File(['{}'], 'invalid.json', { type: 'application/json' }));
		await screen.getByRole('button', { name: 'Import' }).click();
		await expect.element(screen.getByText('Referenced global metadata field does not exist.')).toBeInTheDocument();

		selectFile(input, new File(['{}'], 'replacement.json', { type: 'application/json' }));
		await expect.element(screen.getByText('Referenced global metadata field does not exist.')).not.toBeInTheDocument();
		await screen.getByRole('button', { name: 'Import' }).click();

		await vi.waitFor(() => expect(apiState.postMock).toHaveBeenCalledTimes(2));
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it('rejects ZIP files before making a request', async () => {
		const screen = await render(
			<QueryClientProvider client={createQueryClient()}>
				<MetadataTemplateImportDialog isOpen onOpenChange={() => {}} scope={{ kind: 'global' }} />
			</QueryClientProvider>,
		);

		selectFile(
			screen.getByLabelText('Metadata template JSON file').element() as HTMLInputElement,
			new File(['PK'], 'templates.zip', { type: 'application/zip' }),
		);

		await expect.element(screen.getByText('Select one JSON file. ZIP files are not supported.')).toBeInTheDocument();
		expect(apiState.postMock).not.toHaveBeenCalled();
	});

	it('shows file guidance and disables import until a valid JSON file is selected', async () => {
		const onOpenChange = vi.fn();
		const screen = await render(
			<QueryClientProvider client={createQueryClient()}>
				<MetadataTemplateImportDialog isOpen onOpenChange={onOpenChange} scope={{ kind: 'global' }} />
			</QueryClientProvider>,
		);
		const importButton = screen.getByRole('button', { name: 'Import' });

		await expect
			.element(screen.getByRole('listitem').filter({ hasText: 'Only one .json file is supported' }))
			.toBeVisible();
		await expect
			.element(screen.getByRole('listitem').filter({ hasText: 'ZIP files cannot be imported' }))
			.toBeVisible();
		await expect.element(importButton).toBeDisabled();
		expect(apiState.postMock).not.toHaveBeenCalled();
		expect(onOpenChange).not.toHaveBeenCalledWith(false);

		selectFile(
			screen.getByLabelText('Metadata template JSON file').element() as HTMLInputElement,
			new File(['{}'], 'template.json', { type: 'application/json' }),
		);
		await expect.element(importButton).toBeEnabled();
	});
});
