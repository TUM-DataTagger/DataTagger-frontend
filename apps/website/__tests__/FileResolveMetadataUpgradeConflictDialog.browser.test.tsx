import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { FileResolveMetadataUpgradeConflictDialog } from '@/components/File';

const { conflictPayload, openApiPostSpy } = vi.hoisted(() => ({
	conflictPayload: {
		base_version_pk: 'base-version-1',
		conflicts: [
			{
				conflict_id: 'conflict-1',
				new: {
					config: {
						options: ['Simple random sampling', 'Systematic sampling', 'Stratified sampling', 'Cluster sampling'],
					},
					custom_key: 'Sampling technique',
					field_type: 'SELECTION',
					value: null,
				},
				old: {
					config: {
						options: ['Simple random sampling', 'Systematic sampling', 'Stratified sampling', 'Cluster sampling'],
					},
					custom_key: 'Sampling technique',
					field_type: 'SELECTION',
					value: 'Simple random sampling',
				},
			},
		],
	} as const,
	openApiPostSpy: vi.fn(),
}));

vi.mock('next/navigation', () => ({
	useRouter: () => ({
		refresh: vi.fn(),
	}),
}));

vi.mock('@/hooks/useFeatureFlags', () => ({
	useFeatureFlags: () => ({
		data: {
			definitions: {},
			values: {},
		},
	}),
	isFeatureFlagEnabled: vi.fn(() => true),
}));

vi.mock('@/util/clientFetch', () => ({
	$api: {
		queryOptions: (_method: string, path: string) => ({
			queryKey: [path],
			queryFn: async () => {
				if (path === '/api/v1/uploads-dataset/{id}/upgrade-metadata-payload/') {
					return conflictPayload;
				}

				return {};
			},
		}),
	},
	openAPIClient: {
		POST: openApiPostSpy,
	},
}));

describe('FileResolveMetadataUpgradeConflictDialog', () => {
	beforeEach(() => {
		const newMetadata = conflictPayload.conflicts[0].new as unknown as {
			config: { options: string[] };
			value: string | null;
		};
		newMetadata.config = {
			options: ['Simple random sampling', 'Systematic sampling', 'Stratified sampling', 'Cluster sampling'],
		};
		newMetadata.value = null;
		openApiPostSpy.mockReset();
		openApiPostSpy.mockResolvedValue({
			data: {},
			error: null,
			response: new Response(null, { status: 200 }),
		});
	});

	it('shows canonical choice validation and does not submit trim-created collisions', async () => {
		const newMetadata = conflictPayload.conflicts[0].new as unknown as {
			config: { options: string[] };
			value: string | null;
		};
		newMetadata.config = { options: ['A', ' A '] };
		newMetadata.value = ' A ';
		const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
		const screen = await render(
			<QueryClientProvider client={queryClient}>
				<FileResolveMetadataUpgradeConflictDialog
					fileUuid="file-1"
					isOpen
					latestVersionPk="version-1"
					onOpenChange={() => {}}
				/>
			</QueryClientProvider>,
		);

		await expect.poll(() => screen.baseElement.textContent).toContain('Sampling technique');
		await screen.getByRole('button', { name: 'Resolve' }).click();
		await expect.element(screen.getByText('Option values must be unique')).toBeVisible();
		expect(openApiPostSpy).not.toHaveBeenCalled();
	});

	it('renders type badges in both panes and keeps copy buttons scoped to existing metadata', async () => {
		const queryClient = new QueryClient({
			defaultOptions: {
				queries: {
					retry: false,
				},
			},
		});

		const screen = await render(
			<QueryClientProvider client={queryClient}>
				<FileResolveMetadataUpgradeConflictDialog
					fileUuid="file-1"
					isOpen
					latestVersionPk="version-1"
					onOpenChange={() => {}}
				/>
			</QueryClientProvider>,
		);

		await expect
			.poll(() => (screen.baseElement.textContent?.match(/Sampling technique/g) ?? []).length)
			.toBeGreaterThanOrEqual(2);
		await expect
			.poll(() => (screen.baseElement.textContent?.match(/Single select/g) ?? []).length)
			.toBeGreaterThanOrEqual(2);
		await expect.poll(() => screen.baseElement.querySelectorAll('button[aria-label^="Copy option"]').length).toBe(4);
	});

	it('submits through the footer resolve button and closes on success', async () => {
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
				<FileResolveMetadataUpgradeConflictDialog
					fileUuid="file-1"
					isOpen
					latestVersionPk="version-1"
					onOpenChange={onOpenChange}
				/>
			</QueryClientProvider>,
		);

		await expect
			.poll(() => (screen.baseElement.textContent?.match(/Sampling technique/g) ?? []).length)
			.toBeGreaterThanOrEqual(2);

		await screen.getByRole('button', { name: 'Resolve' }).click();

		await vi.waitFor(() => {
			expect(openApiPostSpy).toHaveBeenCalledWith('/api/v1/uploads-dataset/{id}/resolve-upgrade-metadata-conflict/', {
				body: {
					base_version_pk: 'base-version-1',
					resolutions: [{ conflict_id: 'conflict-1', value: null }],
				},
				params: { path: { id: 'file-1' } },
			});
			expect(onOpenChange).toHaveBeenCalledWith(false);
		});
	});
});
