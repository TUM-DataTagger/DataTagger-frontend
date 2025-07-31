import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupWorker } from 'msw/browser';
import { withNuqsTestingAdapter, type OnUrlUpdateFunction } from 'nuqs/adapters/testing';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { BulkEditAssignToFolderButton, BulkEditToolbar } from '@/components/BulkEditToolbar';
import { makeQueryClient } from '@/util/getQueryClient';

const server = setupWorker(
	http.get('/api/v1/folder/', () =>
		HttpResponse.json({
			count: 10,
			next: null,
			previous: null,
			results: [
				{
					pk: '123',
					name: 'Test Folder',
					project: {
						name: 'Test Project',
					},
				},
			],
		}),
	),
);

beforeAll(async () => {
	await server.start({ onUnhandledRequest: 'error' });
});

afterAll(() => {
	server.stop();
});

afterEach(() => {
	server.resetHandlers();
});

describe('BulkEditToolbar', async () => {
	it('renders the bulk edit switch when not in bulk edit mode', async () => {
		const queryClient = makeQueryClient();
		const mockOnUrlUpdate = vi.fn<OnUrlUpdateFunction>();
		const screen = render(
			<QueryClientProvider client={queryClient}>
				<BulkEditToolbar count={10}>
					<BulkEditAssignToFolderButton />
				</BulkEditToolbar>
			</QueryClientProvider>,
			{
				wrapper: withNuqsTestingAdapter({
					searchParams: {},
					onUrlUpdate: mockOnUrlUpdate,
				}),
			},
		);

		await expect.element(screen.getByRole('switch', { name: 'Bulk edit' })).toBeInTheDocument();
		await expect.element(screen.getByText('of 10 selected')).not.toBeInTheDocument();
	});

	it('renders the selection count and assign button when in bulk edit mode', async () => {
		const queryClient = makeQueryClient();
		const mockOnUrlUpdate = vi.fn<OnUrlUpdateFunction>();
		const screen = render(
			<QueryClientProvider client={queryClient}>
				<BulkEditToolbar count={10}>
					<BulkEditAssignToFolderButton />
				</BulkEditToolbar>
			</QueryClientProvider>,
			{
				wrapper: withNuqsTestingAdapter({
					searchParams: {
						bulk_edit: 'true',
						selected: '1,2,3',
					},
					onUrlUpdate: mockOnUrlUpdate,
				}),
			},
		);

		await expect.element(screen.getByText('3 of 10 selected')).toBeInTheDocument();
		await expect.element(screen.getByRole('button', { name: 'Assign to folder' })).toBeInTheDocument();
	});

	it('disables the assign button when no items are selected', async () => {
		const queryClient = makeQueryClient();
		const mockOnUrlUpdate = vi.fn<OnUrlUpdateFunction>();
		const screen = render(
			<QueryClientProvider client={queryClient}>
				<BulkEditToolbar count={10}>
					<BulkEditAssignToFolderButton />
				</BulkEditToolbar>
			</QueryClientProvider>,
			{
				wrapper: withNuqsTestingAdapter({
					searchParams: {
						bulk_edit: 'true',
						selected: '',
					},
					onUrlUpdate: mockOnUrlUpdate,
				}),
			},
		);

		const assignButton = screen.getByRole('button', { name: 'Assign to folder' });
		await expect.element(assignButton).toBeDisabled();
	});

	it('enables the assign button when items are selected', async () => {
		const queryClient = makeQueryClient();
		const mockOnUrlUpdate = vi.fn<OnUrlUpdateFunction>();
		const screen = render(
			<QueryClientProvider client={queryClient}>
				<BulkEditToolbar count={10}>
					<BulkEditAssignToFolderButton />
				</BulkEditToolbar>
			</QueryClientProvider>,
			{
				wrapper: withNuqsTestingAdapter({
					searchParams: {
						bulk_edit: 'true',
						selected: '1,2',
					},
					onUrlUpdate: mockOnUrlUpdate,
				}),
			},
		);

		const assignButton = screen.getByRole('button', { name: 'Assign to folder' });
		await expect.element(assignButton).not.toBeDisabled();
	});

	it('toggles bulk edit mode and clears selection when switch is clicked', async () => {
		const queryClient = makeQueryClient();
		const mockOnUrlUpdate = vi.fn<OnUrlUpdateFunction>();
		const screen = render(
			<QueryClientProvider client={queryClient}>
				<BulkEditToolbar count={10}>
					<BulkEditAssignToFolderButton />
				</BulkEditToolbar>
			</QueryClientProvider>,
			{
				wrapper: withNuqsTestingAdapter({
					searchParams: {},
					onUrlUpdate: mockOnUrlUpdate,
				}),
			},
		);

		await screen.getByRole('switch', { name: 'Bulk edit' }).click({ force: true });

		screen.rerender(
			<QueryClientProvider client={queryClient}>
				<BulkEditToolbar count={10}>
					<BulkEditAssignToFolderButton />
				</BulkEditToolbar>
			</QueryClientProvider>,
		);

		await expect.element(screen.getByText('0 of 10 selected')).toBeInTheDocument();
		await expect.element(screen.getByRole('button', { name: 'Assign to folder' })).toBeInTheDocument();
		expect(mockOnUrlUpdate).toHaveBeenCalledOnce();
		const event = mockOnUrlUpdate.mock.calls[0]![0];
		expect(event.searchParams.get('bulk_edit')).toBe('true');
		expect(event.searchParams.get('selected')).toBeNull();
	});

	it('toggles bulk edit mode off and clears selection when switch is clicked while in bulk edit mode', async () => {
		const queryClient = makeQueryClient();
		const mockOnUrlUpdate = vi.fn<OnUrlUpdateFunction>();
		const screen = render(
			<QueryClientProvider client={queryClient}>
				<BulkEditToolbar count={10}>
					<BulkEditAssignToFolderButton />
				</BulkEditToolbar>
			</QueryClientProvider>,
			{
				wrapper: withNuqsTestingAdapter({
					searchParams: {
						bulk_edit: 'true',
						selected: '1,2',
					},
					onUrlUpdate: mockOnUrlUpdate,
				}),
			},
		);

		await screen.getByRole('switch', { name: 'Bulk edit' }).click({ force: true });

		screen.rerender(
			<QueryClientProvider client={queryClient}>
				<BulkEditToolbar count={10}>
					<BulkEditAssignToFolderButton />
				</BulkEditToolbar>
			</QueryClientProvider>,
		);

		await expect.element(screen.getByText('of 10 selected')).not.toBeInTheDocument();
		await expect.element(screen.getByRole('switch', { name: 'Bulk edit' })).toBeInTheDocument();
		expect(mockOnUrlUpdate).toHaveBeenCalledOnce();
		const event = mockOnUrlUpdate.mock.calls[0]![0];
		expect(event.searchParams.get('bulk_edit')).toBeNull();
		expect(event.searchParams.get('selected')).toBeNull();
	});
});
