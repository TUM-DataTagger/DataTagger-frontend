// @vitest-environment happy-dom

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardHeadlineRegion } from '@/app/(main)/DashboardHeadline';
import { DashboardSnapshotRegionsProvider } from '@/app/(main)/DashboardSnapshotRegion';
import { DashboardUpcomingAutoDeletionRegion } from '@/app/(main)/UpcomingAutoDeletion';
import { $api } from '@/util/clientFetch';
import {
	DASHBOARD_SNAPSHOT_STALE_TIME,
	dashboardSnapshotQueryOptions,
	type DashboardSnapshot,
} from '@/util/dashboardSnapshot';

const testState = vi.hoisted(() => ({
	openAPIClientGET: vi.fn(),
}));

const EMPTY_UPCOMING_AUTO_DELETION = {
	today_or_tomorrow: 0,
	in_2_to_3_days: 0,
	in_4_to_7_days: 0,
	in_8_to_14_days: 0,
} as const;

vi.mock('@/util/clientFetch', () => ({
	$api: {
		queryOptions: (_method: string, path: string, _requestOptions: unknown, queryOptions: object) => ({
			...queryOptions,
			queryKey: ['get', path],
			queryFn: async () => {
				const { data, error, response } = await testState.openAPIClientGET(path);
				if (!data || (response && !response.ok)) {
					throw error instanceof Error ? error : new Error('Dashboard Snapshot could not be loaded.');
				}
				return data;
			},
		}),
	},
	openAPIClient: {
		GET: testState.openAPIClientGET,
	},
}));

function renderHeadline() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
		},
	});

	return {
		queryClient,
		...render(
			<QueryClientProvider client={queryClient}>
				<DashboardSnapshotRegionsProvider>
					<DashboardHeadlineRegion />
				</DashboardSnapshotRegionsProvider>
			</QueryClientProvider>,
		),
	};
}

function renderSnapshotRegions() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
		},
	});

	return {
		queryClient,
		...render(
			<QueryClientProvider client={queryClient}>
				<DashboardSnapshotRegionsProvider>
					<DashboardHeadlineRegion />
					<div>Upload dropzone</div>
					<DashboardUpcomingAutoDeletionRegion />
				</DashboardSnapshotRegionsProvider>
			</QueryClientProvider>,
		),
	};
}

function createSnapshot(
	resourceCounts: {
		readonly collaborating_projects: number;
		readonly created_projects: number;
		readonly datasets_missing_files: number;
		readonly draft_datasets: number;
		readonly project_datasets: number;
	},
	upcomingAutoDeletion: DashboardSnapshot['upcoming_auto_deletion'] = EMPTY_UPCOMING_AUTO_DELETION,
) {
	return {
		generated_at: '2026-07-13T12:00:00Z',
		resource_counts: resourceCounts,
		upcoming_auto_deletion: upcomingAutoDeletion,
	};
}

describe('Dashboard Snapshot', () => {
	beforeEach(() => {
		testState.openAPIClientGET.mockReset();
	});

	afterEach(() => {
		cleanup();
	});

	it('renders the headline totals and positive missing-file warning from one snapshot', async () => {
		testState.openAPIClientGET.mockResolvedValue({
			data: createSnapshot({
				draft_datasets: 1,
				project_datasets: 12,
				created_projects: 1,
				collaborating_projects: 3,
				datasets_missing_files: 2,
			}),
			response: { ok: true },
		});

		renderHeadline();

		expect(await screen.findByText('1 file')).toBeDefined();
		expect(screen.getByText('12 files')).toBeDefined();
		expect(screen.getByText('1 project')).toBeDefined();
		expect(screen.getByText('3 projects')).toBeDefined();
		const missingFileWarning = screen.getByRole('button', { name: /2 missing files detected/i });
		fireEvent.click(missingFileWarning);
		expect(screen.queryByRole('dialog')).toBeNull();
		expect(missingFileWarning).toBeDefined();
		expect(testState.openAPIClientGET).toHaveBeenCalledTimes(1);
		expect(testState.openAPIClientGET).toHaveBeenCalledWith('/api/v1/dashboard/');
	});

	it('keeps zero-valued headline cards visible and hides the missing-file warning', async () => {
		testState.openAPIClientGET.mockResolvedValue({
			data: createSnapshot({
				draft_datasets: 0,
				project_datasets: 0,
				created_projects: 0,
				collaborating_projects: 0,
				datasets_missing_files: 0,
			}),
			response: { ok: true },
		});

		renderHeadline();

		expect(await screen.findAllByText('0 files')).toHaveLength(2);
		expect(screen.getAllByText('0 projects')).toHaveLength(2);
		expect(screen.queryByRole('button', { name: /missing files detected/i })).toBeNull();
	});

	it('shows a shape-preserving fallback while the initial snapshot is pending', () => {
		testState.openAPIClientGET.mockReturnValue(new Promise(() => {}));

		renderHeadline();

		expect(screen.getByLabelText('Loading dashboard summary')).toBeDefined();
		expect(screen.queryByText('0 files')).toBeNull();
	});

	it('shows an honest initial failure and recovers through Retry', async () => {
		testState.openAPIClientGET.mockRejectedValueOnce(new Error('dashboard unavailable')).mockResolvedValueOnce({
			data: createSnapshot({
				draft_datasets: 4,
				project_datasets: 0,
				created_projects: 0,
				collaborating_projects: 0,
				datasets_missing_files: 0,
			}),
			response: { ok: true },
		});

		renderHeadline();

		expect(await screen.findByText('Dashboard summary could not be loaded.')).toBeDefined();
		expect(screen.queryByText('0 files')).toBeNull();
		fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
		expect(await screen.findByText('4 files')).toBeDefined();
		expect(testState.openAPIClientGET).toHaveBeenCalledTimes(2);
	});

	it('renders every auto-deletion bucket from the same Dashboard Snapshot request', async () => {
		testState.openAPIClientGET.mockResolvedValue({
			data: createSnapshot(
				{
					draft_datasets: 4,
					project_datasets: 5,
					created_projects: 1,
					collaborating_projects: 2,
					datasets_missing_files: 0,
				},
				{
					today_or_tomorrow: 1,
					in_2_to_3_days: 2,
					in_4_to_7_days: 3,
					in_8_to_14_days: 4,
				},
			),
			response: { ok: true },
		});

		renderSnapshotRegions();

		expect(await screen.findByText('1 day left')).toBeDefined();
		expect(screen.getByText('1 file affected')).toBeDefined();
		expect(screen.getByText('2-3 days left')).toBeDefined();
		expect(screen.getByText('2 files affected')).toBeDefined();
		expect(screen.getByText('4-7 days left')).toBeDefined();
		expect(screen.getByText('3 files affected')).toBeDefined();
		expect(screen.getByText('8-14 days left')).toBeDefined();
		expect(screen.getByText('4 files affected')).toBeDefined();
		expect(testState.openAPIClientGET).toHaveBeenCalledTimes(1);
	});

	it('preserves the auto-deletion empty state when every bucket is zero', async () => {
		testState.openAPIClientGET.mockResolvedValue({
			data: createSnapshot({
				draft_datasets: 0,
				project_datasets: 0,
				created_projects: 0,
				collaborating_projects: 0,
				datasets_missing_files: 0,
			}),
			response: { ok: true },
		});

		renderSnapshotRegions();

		expect(await screen.findByText('No auto-deletion detected within the next 14 days')).toBeDefined();
	});

	it('loads both snapshot regions independently from unrelated dashboard content', () => {
		testState.openAPIClientGET.mockReturnValue(new Promise(() => {}));

		renderSnapshotRegions();

		expect(screen.getByText('Upload dropzone')).toBeDefined();
		expect(screen.getByLabelText('Loading dashboard summary')).toBeDefined();
		expect(screen.getByLabelText('Loading upcoming auto-deletion')).toBeDefined();
		expect(testState.openAPIClientGET).toHaveBeenCalledTimes(1);
	});

	it('recovers both localized failure regions through either shared Retry action', async () => {
		testState.openAPIClientGET.mockRejectedValueOnce(new Error('dashboard unavailable')).mockResolvedValueOnce({
			data: createSnapshot(
				{
					draft_datasets: 6,
					project_datasets: 0,
					created_projects: 0,
					collaborating_projects: 0,
					datasets_missing_files: 0,
				},
				{
					today_or_tomorrow: 1,
					in_2_to_3_days: 0,
					in_4_to_7_days: 0,
					in_8_to_14_days: 0,
				},
			),
			response: { ok: true },
		});

		renderSnapshotRegions();

		expect(await screen.findByText('Dashboard summary could not be loaded.')).toBeDefined();
		expect(screen.getByText('Upcoming auto-deletion could not be loaded.')).toBeDefined();
		fireEvent.click(screen.getAllByRole('button', { name: 'Retry' })[1]!);
		expect(await screen.findByText('6 files')).toBeDefined();
		expect(screen.getByText('1 file affected')).toBeDefined();
		expect(testState.openAPIClientGET).toHaveBeenCalledTimes(2);
	});

	it('uses a 60-second freshness window without polling', () => {
		const options = dashboardSnapshotQueryOptions($api);

		expect(options.staleTime).toBe(DASHBOARD_SNAPSHOT_STALE_TIME);
		expect(options.staleTime).toBe(60_000);
		expect(options).not.toHaveProperty('refetchInterval');
	});

	it('keeps the last successful snapshot visible when a background refresh fails', async () => {
		testState.openAPIClientGET.mockResolvedValueOnce({
			data: createSnapshot(
				{
					draft_datasets: 8,
					project_datasets: 9,
					created_projects: 1,
					collaborating_projects: 2,
					datasets_missing_files: 0,
				},
				{
					today_or_tomorrow: 1,
					in_2_to_3_days: 0,
					in_4_to_7_days: 0,
					in_8_to_14_days: 0,
				},
			),
			response: { ok: true },
		});

		const { queryClient } = renderSnapshotRegions();
		expect(await screen.findByText('8 files')).toBeDefined();
		expect(screen.getByText('1 file affected')).toBeDefined();

		testState.openAPIClientGET.mockRejectedValueOnce(new Error('background refresh failed'));
		await act(async () => {
			await queryClient.invalidateQueries({ queryKey: dashboardSnapshotQueryOptions($api).queryKey });
		});
		await waitFor(() => {
			expect(testState.openAPIClientGET).toHaveBeenCalledTimes(2);
		});

		expect(screen.getByText('8 files')).toBeDefined();
		expect(screen.getByText('1 file affected')).toBeDefined();
		expect(screen.queryByText('Dashboard summary could not be loaded.')).toBeNull();
		expect(screen.queryByText('Upcoming auto-deletion could not be loaded.')).toBeNull();
	});
});
