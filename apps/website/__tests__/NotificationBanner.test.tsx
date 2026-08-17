// @vitest-environment happy-dom

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationBanner } from '@/components/NotificationBanner';
import { notificationBannerQueryKey } from '@/util/notificationBanner';

const testState = vi.hoisted(() => ({
	openAPIClientGET: vi.fn(),
}));

vi.mock('@/util/clientFetch', () => ({
	openAPIClient: {
		GET: testState.openAPIClientGET,
	},
}));

function createQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
		},
	});
}

function renderWithClient(children: ReactNode, client = createQueryClient()) {
	return {
		client,
		...render(<QueryClientProvider client={client}>{children}</QueryClientProvider>),
	};
}

describe('NotificationBanner', () => {
	beforeEach(() => {
		testState.openAPIClientGET.mockReset();
	});

	afterEach(() => {
		cleanup();
		vi.useRealTimers();
	});

	it('renders the trimmed settings-backed message as a warning alert with the default warning icon', async () => {
		testState.openAPIClientGET.mockResolvedValue({
			data: { key: 'NOTIFICATION_BANNER_MESSAGE', value: '  Planned maintenance tonight.  ' },
			response: { ok: true },
		});

		renderWithClient(<NotificationBanner />);

		const alert = await screen.findByRole('alert');
		const icon = alert.querySelector('svg');
		expect(alert.textContent).toBe('Planned maintenance tonight.');
		expect(icon?.classList.contains('lucide-triangle-alert')).toBe(true);
		expect(icon?.getAttribute('width')).toBe('24');
		expect(icon?.getAttribute('height')).toBe('24');
		expect(alert.className).toContain('bg-base-tangerine-100');
	});

	it('renders nothing for blank, missing, and failed settings', async () => {
		testState.openAPIClientGET.mockResolvedValueOnce({
			data: { key: 'NOTIFICATION_BANNER_MESSAGE', value: '   ' },
			response: { ok: true },
		});

		const { unmount } = renderWithClient(<NotificationBanner />);

		await waitFor(() => {
			expect(testState.openAPIClientGET).toHaveBeenCalled();
		});
		expect(screen.queryByRole('alert')).toBeNull();
		unmount();

		testState.openAPIClientGET.mockRejectedValueOnce(new Error('settings unavailable'));
		renderWithClient(<NotificationBanner />);

		await waitFor(() => {
			expect(testState.openAPIClientGET).toHaveBeenCalledTimes(2);
		});
		expect(screen.queryByRole('alert')).toBeNull();
		cleanup();

		testState.openAPIClientGET.mockResolvedValueOnce({
			data: undefined,
			response: { ok: false, status: 404 },
		});
		renderWithClient(<NotificationBanner />);

		await waitFor(() => {
			expect(testState.openAPIClientGET).toHaveBeenCalledTimes(3);
		});
		expect(screen.queryByRole('alert')).toBeNull();
	});

	it('supports explicit severities and iconless rendering', () => {
		renderWithClient(<NotificationBanner icon={null} message="Read-only mode" severity="info" useSettings={false} />);

		const alert = screen.getByRole('alert');
		expect(alert.textContent).toBe('Read-only mode');
		expect(alert.querySelector('svg')).toBeNull();
		expect(alert.className).toContain('bg-base-crystal-100');
	});

	it('uses hydrated data and polls for setting changes', async () => {
		vi.useFakeTimers();

		const client = createQueryClient();
		client.setQueryData(notificationBannerQueryKey, 'Initial maintenance window');

		testState.openAPIClientGET.mockResolvedValueOnce({
			data: { key: 'NOTIFICATION_BANNER_MESSAGE', value: 'Maintenance window extended' },
			response: { ok: true },
		});

		renderWithClient(<NotificationBanner />, client);

		expect(screen.getByRole('alert').textContent).toBe('Initial maintenance window');

		await act(async () => {
			await vi.advanceTimersByTimeAsync(60_000);
		});
		expect(testState.openAPIClientGET).toHaveBeenCalledTimes(1);
		await vi.waitFor(() => {
			expect(screen.getByRole('alert').textContent).toBe('Maintenance window extended');
		});
	});
});
