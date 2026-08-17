import { describe, expect, it } from 'vitest';
import { shouldTriggerSessionExpiryRedirect } from '@/util/sessionExpiryPolicy';

describe('sessionExpiryPolicy', () => {
	it('does not trigger on expected unauthenticated endpoints', () => {
		expect(
			shouldTriggerSessionExpiryRedirect({
				requestPathname: '/api/v1/auth/',
				currentPathname: '/login',
				source: 'openapi_client_401',
			}),
		).toBe(false);
		expect(
			shouldTriggerSessionExpiryRedirect({
				requestPathname: '/api/v1/authrefresh/',
				currentPathname: '/login',
				source: 'openapi_client_401',
			}),
		).toBe(false);
		expect(
			shouldTriggerSessionExpiryRedirect({
				requestPathname: '/api/v1/reset-password/confirm/',
				currentPathname: '/reset-password',
				source: 'openapi_client_401',
			}),
		).toBe(false);
	});

	it('does not trigger while already on public auth or content routes', () => {
		expect(
			shouldTriggerSessionExpiryRedirect({
				requestPathname: '/api/v1/user/me/',
				currentPathname: '/login',
				source: 'openapi_client_401',
			}),
		).toBe(false);
		expect(
			shouldTriggerSessionExpiryRedirect({
				requestPathname: '/api/v1/user/me/',
				currentPathname: '/faq',
				source: 'openapi_client_401',
			}),
		).toBe(false);
	});

	it('suppresses websocket/session-expiry redirects on public routes but triggers on protected routes', () => {
		expect(
			shouldTriggerSessionExpiryRedirect({
				currentPathname: '/login',
				source: 'websocket_auth_error',
			}),
		).toBe(false);
		expect(
			shouldTriggerSessionExpiryRedirect({
				requestPathname: '/api/v1/user/me/',
				currentPathname: '/projects/project-1',
				source: 'openapi_client_401',
			}),
		).toBe(true);
		expect(
			shouldTriggerSessionExpiryRedirect({
				source: 'websocket_auth_error',
				currentPathname: '/projects/project-1',
			}),
		).toBe(true);
	});
});
