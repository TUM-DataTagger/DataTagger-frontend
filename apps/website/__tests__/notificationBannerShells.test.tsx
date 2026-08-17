// @vitest-environment happy-dom

import type * as ReactQuery from '@tanstack/react-query';
import { cleanup, render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ContentLayout from '@/app/(content)/layout';
import MainLayout from '@/app/(main)/layout';

const testState = vi.hoisted(() => ({
	openAPIClientGET: vi.fn(),
	requireCurrentUserOrRedirect: vi.fn(),
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
	const actual = await importOriginal<typeof ReactQuery>();

	return {
		...actual,
		dehydrate: vi.fn(() => null),
		HydrationBoundary: ({ children }: { readonly children: ReactNode }) => <>{children}</>,
	};
});

vi.mock('@/app/Navigation', () => ({
	Navigation: () => <nav data-testid="navigation">Navigation</nav>,
}));

vi.mock('@/components/NotificationBanner', () => ({
	NotificationBanner: () => <div data-testid="notification-banner">Notification banner</div>,
}));

vi.mock('@/app/(main)/MainNotificationBanner', () => ({
	MainNotificationBanner: () => <div data-testid="notification-banner">Notification banner</div>,
}));

vi.mock('@/components/SideSheet', () => ({
	SideSheetNoSSR: () => null,
}));

vi.mock('@/components/TestEnvironmentBanner', () => ({
	TestEnvironmentBannerNoSSR: () => null,
}));

vi.mock('@/components/ui/Sidebar', () => ({
	SidebarInset: ({ children }: { readonly children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/Toast', () => ({
	GlobalToastRegion: () => null,
}));

vi.mock('@/components/upload-assistant/GlobalUploadAssistant', () => ({
	GlobalUploadAssistantNoSSR: () => null,
}));

vi.mock('@/app/(main)/GlobalDropZone', () => ({
	GlobalDropZone: () => null,
}));

vi.mock('@/app/(main)/providers', () => ({
	Providers: ({ children }: { readonly children: ReactNode }) => <>{children}</>,
}));

vi.mock('@/app/(content)/providers', () => ({
	Providers: ({ children }: { readonly children: ReactNode }) => <>{children}</>,
}));

vi.mock('@/app/(content)/ScrollToTopButton', () => ({
	ScrollToTopButton: () => null,
}));

vi.mock('@/util/fetch', () => ({
	$api: {
		queryOptions: (method: string, path: string, options?: unknown) => ({
			queryKey: [method, path, options],
		}),
	},
	openAPIClient: {
		GET: testState.openAPIClientGET,
	},
}));

vi.mock('@/util/serverAuth', () => ({
	requireCurrentUserOrRedirect: testState.requireCurrentUserOrRedirect,
}));

describe('Notification Banner shell placement', () => {
	beforeEach(() => {
		testState.openAPIClientGET.mockReset();
		testState.requireCurrentUserOrRedirect.mockReset();
	});

	afterEach(() => {
		cleanup();
	});

	it('places the main shell banner below navigation and before children', async () => {
		testState.requireCurrentUserOrRedirect.mockResolvedValue({ pk: 1 });
		testState.openAPIClientGET.mockResolvedValue({
			data: { key: 'NOTIFICATION_BANNER_MESSAGE', value: null },
			response: { ok: true },
		});

		const layout = await MainLayout({ children: <main data-testid="page-content">Page content</main> });
		const screen = render(layout);

		const navigation = screen.getByTestId('navigation');
		const banner = screen.getByTestId('notification-banner');
		const pageContent = screen.getByTestId('page-content');

		expect(navigation.compareDocumentPosition(banner) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		expect(banner.compareDocumentPosition(pageContent) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	});

	it('places the authenticated content shell banner below navigation and before children', async () => {
		testState.openAPIClientGET.mockResolvedValue({
			data: { key: 'NOTIFICATION_BANNER_MESSAGE', value: null },
			response: { ok: true },
		});

		const layout = await ContentLayout({ children: <main data-testid="page-content">Page content</main> });
		const screen = render(layout);

		const navigation = screen.getByTestId('navigation');
		const banner = screen.getByTestId('notification-banner');
		const pageContent = screen.getByTestId('page-content');

		expect(navigation.compareDocumentPosition(banner) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		expect(banner.compareDocumentPosition(pageContent) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	});

	it('places the unauthenticated content shell banner before children when navigation is absent', async () => {
		testState.openAPIClientGET.mockResolvedValue({
			data: { key: 'NOTIFICATION_BANNER_MESSAGE', value: null },
			response: { ok: false, status: 401 },
		});

		const layout = await ContentLayout({ children: <main data-testid="page-content">Page content</main> });
		const screen = render(layout);

		const banner = screen.getByTestId('notification-banner');
		const pageContent = screen.getByTestId('page-content');

		expect(screen.queryByTestId('navigation')).toBeNull();
		expect(banner.compareDocumentPosition(pageContent) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	});
});
