// @vitest-environment happy-dom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MainNotificationBanner } from '@/app/(main)/MainNotificationBanner';

const testState = vi.hoisted(() => ({
	pathname: '/',
}));

vi.mock('next/navigation', () => ({
	usePathname: () => testState.pathname,
}));

vi.mock('@/components/NotificationBanner', () => ({
	NotificationBanner: ({ containerClassName }: { readonly containerClassName?: string }) => (
		<div className={containerClassName} data-testid="notification-banner" />
	),
}));

describe('MainNotificationBanner', () => {
	afterEach(() => {
		cleanup();
		testState.pathname = '/';
	});

	it('matches the wide dashboard content container', () => {
		render(<MainNotificationBanner />);

		expect(screen.getByTestId('notification-banner').className).toContain('max-w-[1136px]');
	});

	it('keeps the standard content width on other main routes', () => {
		testState.pathname = '/projects';
		render(<MainNotificationBanner />);

		expect(screen.getByTestId('notification-banner').className).toContain('max-w-[856px]');
	});
});
