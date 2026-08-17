import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { BulkFileDeleteDialog } from '@/components/File';
import type * as ToastModule from '@/components/ui/Toast';
import { ToastType } from '@/components/ui/Toast';

const nuqsState = vi.hoisted(() => ({
	queryStates: {
		bulk_edit: true,
		selected: ['file-1', 'file-2', 'file-3'],
	} as Record<string, unknown>,
	setQueryStates: vi.fn(async (_nextValue: Record<string, unknown>) => {}),
}));

const apiState = vi.hoisted(() => ({
	postMock: vi.fn(),
}));

const toastState = vi.hoisted(() => ({
	add: vi.fn(),
}));

vi.mock('nuqs', async () => {
	const React = await import('react');

	return {
		parseAsArrayOf: () => ({
			withDefault: (defaultValue: string[]) => ({ defaultValue }),
		}),
		parseAsBoolean: {
			withDefault: (defaultValue: boolean) => ({ defaultValue }),
		},
		parseAsString: {
			withDefault: (defaultValue: string) => ({ defaultValue }),
		},
		useQueryState: (_queryKey: string, parser?: { readonly defaultValue?: unknown }) => {
			const [value, setValue] = React.useState(parser?.defaultValue ?? null);
			return [value, setValue] as const;
		},
		useQueryStates: (schema: Record<string, { readonly defaultValue?: unknown }>) => {
			const initialValue = Object.fromEntries(
				Object.entries(schema).map(([key, parser]) => [key, nuqsState.queryStates[key] ?? parser.defaultValue ?? null]),
			);
			const [state, setState] = React.useState<Record<string, unknown>>(initialValue);

			return [
				state,
				async (nextValue: Record<string, unknown>) => {
					void nuqsState.setQueryStates(nextValue);
					setState((currentValue) => ({
						...currentValue,
						...nextValue,
					}));
				},
			] as const;
		},
	};
});

vi.mock('next/navigation', () => ({
	useRouter: () => ({
		push: vi.fn(),
		refresh: vi.fn(),
	}),
}));

vi.mock('@/util/clientFetch', () => ({
	$api: {
		queryOptions: (method: string, path: string, options?: { readonly params?: unknown }) => ({
			queryKey: [method, path, options?.params ?? null],
		}),
	},
	openAPIClient: {
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
			queries: { retry: false },
			mutations: { retry: false },
		},
	});
}

describe('BulkFileDeleteDialog', () => {
	beforeEach(() => {
		apiState.postMock.mockReset();
		toastState.add.mockReset();
		nuqsState.queryStates = {
			bulk_edit: true,
			selected: ['file-1', 'file-2', 'file-3'],
		};
		nuqsState.setQueryStates.mockClear();
	});

	it('exits bulk mode and shows a success toast after a successful delete', async () => {
		apiState.postMock.mockResolvedValueOnce({
			data: { success: ['file-1', 'file-2', 'file-3'], error: [] },
			error: null,
			response: new Response(null, { status: 200 }),
		});

		const screen = await render(
			<QueryClientProvider client={createQueryClient()}>
				<BulkFileDeleteDialog isOpen onOpenChange={() => {}} selected={['file-1', 'file-2', 'file-3']} />
			</QueryClientProvider>,
		);

		await screen.getByRole('button', { name: 'Delete' }).click();

		await vi.waitFor(() => {
			expect(nuqsState.setQueryStates).toHaveBeenCalledWith({ bulk_edit: false, selected: [] });
		});

		expect(toastState.add).toHaveBeenCalledWith(
			expect.objectContaining({
				message: expect.stringContaining('file'),
				type: ToastType.Success,
			}),
			expect.anything(),
		);
		expect(toastState.add.mock.calls[0]?.[0].message).toMatch(/3 files? deleted/);
	});

	it('shows an error toast naming both counts when only some files were deleted', async () => {
		apiState.postMock.mockResolvedValueOnce({
			data: { success: ['file-1'], error: ['file-2', 'file-3'] },
			error: null,
			response: new Response(null, { status: 200 }),
		});

		const screen = await render(
			<QueryClientProvider client={createQueryClient()}>
				<BulkFileDeleteDialog isOpen onOpenChange={() => {}} selected={['file-1', 'file-2', 'file-3']} />
			</QueryClientProvider>,
		);

		await screen.getByRole('button', { name: 'Delete' }).click();

		await vi.waitFor(() => {
			expect(toastState.add).toHaveBeenCalled();
		});

		const toastPayload = toastState.add.mock.calls[0]?.[0];
		expect(toastPayload?.type).toBe(ToastType.Error);
		expect(toastPayload?.message).toMatch(/1 file deleted/);
		expect(toastPayload?.message).toMatch(/2 could not be deleted/);
	});

	it('keeps the modal open and skips the success toast when every file was rejected', async () => {
		apiState.postMock.mockResolvedValueOnce({
			data: { success: [], error: ['file-1', 'file-2', 'file-3'] },
			error: null,
			response: new Response(null, { status: 200 }),
		});

		const onOpenChange = vi.fn();
		const screen = await render(
			<QueryClientProvider client={createQueryClient()}>
				<BulkFileDeleteDialog isOpen onOpenChange={onOpenChange} selected={['file-1', 'file-2', 'file-3']} />
			</QueryClientProvider>,
		);

		await screen.getByRole('button', { name: 'Delete' }).click();

		await vi.waitFor(() => {
			expect(screen.getByText(/could not be deleted/i).elements().length).toBeGreaterThan(0);
		});

		expect(onOpenChange).not.toHaveBeenCalled();
		expect(toastState.add).not.toHaveBeenCalled();
	});
});
