import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadSessionExpiryModule() {
	vi.resetModules();

	const clearMock = vi.fn();
	const getQueryClientMock = vi.fn(() => ({ clear: clearMock }));
	const loggerWarnMock = vi.fn();

	vi.doMock('@/util/getQueryClient', () => ({
		getQueryClient: getQueryClientMock,
	}));
	vi.doMock('@/util/logger', () => ({
		LogCategory: { Auth: 'Auth' },
		logger: {
			warn: loggerWarnMock,
		},
	}));

	const mod = await import('@/util/sessionExpiry');

	return {
		...mod,
		clearMock,
		getQueryClientMock,
		loggerWarnMock,
	};
}

describe('sessionExpiry', () => {
	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it('ignores 401 handling for configured public auth endpoints', async () => {
		const { shouldIgnore401ForSessionExpiry } = await loadSessionExpiryModule();

		expect(shouldIgnore401ForSessionExpiry('/api/v1/auth/')).toBe(true);
		expect(shouldIgnore401ForSessionExpiry('/api/v1/authrefresh/')).toBe(true);
		expect(shouldIgnore401ForSessionExpiry('/api/v1/authverify/')).toBe(true);
		expect(shouldIgnore401ForSessionExpiry('/api/v1/shibboleth/start/')).toBe(true);
		expect(shouldIgnore401ForSessionExpiry('/api/v1/reset-password/')).toBe(true);
		expect(shouldIgnore401ForSessionExpiry('/api/v1/reset-password/confirm/')).toBe(true);
	});

	it('does not ignore 401 handling for protected endpoints', async () => {
		const { shouldIgnore401ForSessionExpiry } = await loadSessionExpiryModule();

		expect(shouldIgnore401ForSessionExpiry('/api/v1/user/me/')).toBe(false);
		expect(shouldIgnore401ForSessionExpiry('/api/v1/authjwtcookie/')).toBe(false);
		expect(shouldIgnore401ForSessionExpiry('/api/v1/project/project-1/')).toBe(false);
	});

	it('builds session-expired redirect url with encoded next target and strips hash fragments', async () => {
		const { buildSessionExpiredRedirectUrl } = await loadSessionExpiryModule();

		expect(buildSessionExpiredRedirectUrl('/projects/abc?tab=members#section-2')).toBe(
			'/login?next=%2Fprojects%2Fabc%3Ftab%3Dmembers',
		);
		expect(buildSessionExpiredRedirectUrl('')).toBe('/login?next=%2F');
	});

	it('deduplicates session expiry redirects and clears query cache once', async () => {
		const { clearMock, getQueryClientMock, handleSessionExpiry, loggerWarnMock } = await loadSessionExpiryModule();
		const assignMock = vi.fn();

		vi.stubGlobal('window', {
			location: {
				pathname: '/projects/project-1',
				search: '?tab=files',
				assign: assignMock,
			},
		});

		handleSessionExpiry({ source: 'test', status: 401 });
		handleSessionExpiry({ source: 'test-second', status: 401 });

		expect(getQueryClientMock).toHaveBeenCalledTimes(1);
		expect(clearMock).toHaveBeenCalledTimes(1);
		expect(assignMock).toHaveBeenCalledTimes(1);
		expect(assignMock).toHaveBeenCalledWith('/login?next=%2Fprojects%2Fproject-1%3Ftab%3Dfiles');
		expect(loggerWarnMock).toHaveBeenCalledTimes(1);
	});

	it('does not redirect on public auth routes when a background request returns 401', async () => {
		const { clearMock, getQueryClientMock, handleSessionExpiry, loggerWarnMock } = await loadSessionExpiryModule();
		const assignMock = vi.fn();

		vi.stubGlobal('window', {
			location: {
				pathname: '/login',
				search: '',
				assign: assignMock,
			},
		});

		handleSessionExpiry({ source: 'openapi_client_401', requestUrl: '/api/v1/user/me/', status: 401 });

		expect(getQueryClientMock).not.toHaveBeenCalled();
		expect(clearMock).not.toHaveBeenCalled();
		expect(assignMock).not.toHaveBeenCalled();
		expect(loggerWarnMock).not.toHaveBeenCalled();
	});
});
