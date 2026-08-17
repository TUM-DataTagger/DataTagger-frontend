import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Page from '@/app/(main)/page';

const testState = vi.hoisted(() => ({
	homePageEnabledFlag: vi.fn<() => Promise<boolean>>(),
	redirect: vi.fn(),
	openAPIClientGET: vi.fn(),
}));

vi.mock('next/navigation', () => ({
	redirect: testState.redirect,
}));

vi.mock('@/flags', () => ({
	homePageEnabledFlag: testState.homePageEnabledFlag,
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
	openAPIClient: {
		GET: testState.openAPIClientGET,
	},
}));

vi.mock('@/components/ui/SplitText', () => ({
	SplitText: (props: { readonly text: string }) => <span>{props.text}</span>,
}));

vi.mock('@/app/(main)/UpcomingAutoDeletion', () => ({
	UpcomingAutoDeletion: () => <div>Upcoming auto deletion</div>,
}));

describe('main page feature flag guard', () => {
	beforeEach(() => {
		testState.homePageEnabledFlag.mockReset();
		testState.redirect.mockReset();
		testState.openAPIClientGET.mockReset();
	});

	it('redirects to /drafts when the homepage flag is disabled', async () => {
		testState.homePageEnabledFlag.mockResolvedValue(false);
		testState.redirect.mockImplementation(() => {
			throw new Error('NEXT_REDIRECT');
		});

		await expect(Page()).rejects.toThrow('NEXT_REDIRECT');
		expect(testState.redirect).toHaveBeenCalledWith('/drafts');
	});

	it('renders the page when the homepage flag is enabled', async () => {
		testState.homePageEnabledFlag.mockResolvedValue(true);
		testState.openAPIClientGET.mockResolvedValue({ data: { results: [] } });

		const pageResult = await Page();

		expect(testState.redirect).not.toHaveBeenCalled();
		expect(pageResult).toBeDefined();
	});
});
