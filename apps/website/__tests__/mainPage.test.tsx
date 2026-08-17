import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Page from '@/app/(main)/page';

const testState = vi.hoisted(() => ({
	openAPIClientGET: vi.fn(),
}));

vi.mock('@/components/recent-projects/RecentProjectsPanel', () => ({
	RecentProjectsPanel: () => <div>Recent projects</div>,
}));

vi.mock('@/components/ui/Button', () => ({
	Button: (props: { readonly children: ReactNode }) => <button type="button">{props.children}</button>,
}));

vi.mock('@/components/ui/Link', () => ({
	Link: (props: { readonly children: ReactNode; readonly href?: string }) => <a href={props.href}>{props.children}</a>,
}));

vi.mock('@/components/ui/Separator', () => ({
	Separator: () => <div />,
}));

vi.mock('@/components/upload-assistant/DraftsUploadDropzone', () => ({
	DraftsUploadDropzone: () => <div>Upload dropzone</div>,
}));

vi.mock('@/styles/ui/button', () => ({
	buttonStyles: () => '',
}));

vi.mock('@/util/fetch', () => ({
	$api: {
		queryOptions: (_method: string, path: string, _requestOptions: unknown, queryOptions: object) => ({
			...queryOptions,
			queryKey: ['get', path],
			queryFn: async () => {
				const { data, error } = await testState.openAPIClientGET(path);
				if (!data) throw error instanceof Error ? error : new Error('Dashboard Snapshot could not be loaded.');
				return data;
			},
		}),
	},
	openAPIClient: {
		GET: testState.openAPIClientGET,
	},
}));

vi.mock('@/components/ui/SplitText', () => ({
	SplitText: (props: { readonly text: string }) => <span>{props.text}</span>,
}));

vi.mock('@/app/(main)/UpcomingAutoDeletion', () => ({
	DashboardUpcomingAutoDeletionRegion: () => <div>Upcoming auto deletion</div>,
}));

describe('main page', () => {
	beforeEach(() => {
		testState.openAPIClientGET.mockReset();
	});

	it('renders the page and starts the Dashboard Snapshot', async () => {
		testState.openAPIClientGET.mockResolvedValue({
			data: {
				generated_at: '2026-07-13T12:00:00Z',
				resource_counts: {
					draft_datasets: 0,
					project_datasets: 0,
					created_projects: 0,
					collaborating_projects: 0,
					datasets_missing_files: 0,
				},
				upcoming_auto_deletion: {
					today_or_tomorrow: 0,
					in_2_to_3_days: 0,
					in_4_to_7_days: 0,
					in_8_to_14_days: 0,
				},
			},
			response: { ok: true },
		});

		const pageResult = await Page();

		expect(pageResult).toBeDefined();
		expect(testState.openAPIClientGET).toHaveBeenCalledWith('/api/v1/dashboard/');
		expect(testState.openAPIClientGET).not.toHaveBeenCalledWith('/api/v1/uploads-dataset/', expect.anything());
	});
});
