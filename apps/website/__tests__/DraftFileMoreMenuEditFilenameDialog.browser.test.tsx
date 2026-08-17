import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { DraftFileMoreMenuEditFilenameDialog } from '@/app/(main)/drafts/[fileUuid]/DraftFileMoreMenuEditFilenameDialog';

const { patchSpy } = vi.hoisted(() => ({
	patchSpy: vi.fn(),
}));

vi.mock('@/util/clientFetch', () => ({
	$api: {
		queryOptions: (...args: unknown[]) => ({
			queryKey: args,
		}),
	},
	openAPIClient: {
		PATCH: patchSpy,
	},
}));

describe('DraftFileMoreMenuEditFilenameDialog', () => {
	beforeEach(() => {
		patchSpy.mockReset();
		patchSpy.mockResolvedValue({
			error: null,
			response: new Response(null, { status: 200 }),
		});
	});

	it('submits through the footer button while the form remains in the modal body', async () => {
		const onOpenChange = vi.fn();
		const queryClient = new QueryClient({
			defaultOptions: {
				queries: {
					retry: false,
				},
				mutations: {
					retry: false,
				},
			},
		});

		const screen = await render(
			<QueryClientProvider client={queryClient}>
				<DraftFileMoreMenuEditFilenameDialog
					fileUuid="draft-1"
					filename="draft-name"
					isOpen
					onOpenChange={onOpenChange}
				/>
			</QueryClientProvider>,
		);

		await screen.getByRole('button', { name: 'Save changes' }).click();

		await vi.waitFor(() => {
			expect(patchSpy).toHaveBeenCalledWith('/api/v1/uploads-dataset/{id}/', {
				body: { name: 'draft-name' },
				params: { path: { id: 'draft-1' } },
			});
			expect(onOpenChange).toHaveBeenCalledWith(false);
		});
	});
});
