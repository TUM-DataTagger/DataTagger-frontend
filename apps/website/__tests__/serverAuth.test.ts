import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	cookiesMock: vi.fn(),
	getMock: vi.fn(),
	loggerErrorMock: vi.fn(),
	redirectMock: vi.fn(),
}));

vi.mock('next/headers', () => ({
	cookies: mocks.cookiesMock,
}));

vi.mock('next/navigation', () => ({
	redirect: mocks.redirectMock,
}));

vi.mock('@/util/fetch', () => ({
	openAPIClient: {
		GET: mocks.getMock,
	},
}));

vi.mock('@/util/logger', () => ({
	LogCategory: { Auth: 'Auth' },
	logger: {
		error: mocks.loggerErrorMock,
	},
}));

function redirectError(path: string) {
	return new Error(`REDIRECT:${path}`);
}

async function loadServerAuthModule() {
	vi.resetModules();
	return import('@/util/serverAuth');
}

describe('serverAuth', () => {
	beforeEach(() => {
		mocks.getMock.mockReset();
		mocks.loggerErrorMock.mockReset();
		mocks.redirectMock.mockReset();
		mocks.cookiesMock.mockReset();
		mocks.cookiesMock.mockResolvedValue({
			get: vi.fn().mockReturnValue(undefined),
		});
		mocks.redirectMock.mockImplementation((path: string) => {
			throw redirectError(path);
		});
	});

	it('builds login redirect path with safe next targets only', async () => {
		const { buildLoginRedirectPath } = await loadServerAuthModule();

		expect(buildLoginRedirectPath('/projects/123?tab=files')).toBe('/login?next=%2Fprojects%2F123%3Ftab%3Dfiles');
		expect(buildLoginRedirectPath('//evil.com')).toBe('/login');
		expect(buildLoginRedirectPath()).toBe('/login');
	});

	it('returns current user when /me succeeds', async () => {
		const { requireCurrentUserOrRedirect } = await loadServerAuthModule();
		const user = { pk: 123, email: 'a@example.test' };
		mocks.cookiesMock.mockResolvedValue({
			get: vi.fn().mockReturnValue({ value: 'token' }),
		});
		mocks.getMock.mockResolvedValue({
			data: user,
			response: new Response(JSON.stringify(user), { status: 200 }),
		});

		await expect(requireCurrentUserOrRedirect({ nextTarget: '/projects/123' })).resolves.toEqual(user);
		expect(mocks.redirectMock).not.toHaveBeenCalled();
	});

	it('redirects protected requests to login with next when /me returns 401', async () => {
		const { requireCurrentUserOrRedirect } = await loadServerAuthModule();
		mocks.cookiesMock.mockResolvedValue({
			get: vi.fn().mockReturnValue({ value: 'token' }),
		});
		mocks.getMock.mockResolvedValue({
			data: undefined,
			response: new Response('unauthorized', { status: 401 }),
		});

		await expect(requireCurrentUserOrRedirect({ nextTarget: '/projects/123?tab=files' })).rejects.toThrow(
			'REDIRECT:/login?next=%2Fprojects%2F123%3Ftab%3Dfiles',
		);
	});

	it('redirects protected requests to login without calling /me when token cookie is missing', async () => {
		const { requireCurrentUserOrRedirect } = await loadServerAuthModule();

		await expect(requireCurrentUserOrRedirect({ nextTarget: '/projects/123' })).rejects.toThrow(
			'REDIRECT:/login?next=%2Fprojects%2F123',
		);
		expect(mocks.getMock).not.toHaveBeenCalled();
	});

	it('redirects authenticated users away from auth routes to /', async () => {
		const { redirectAuthenticatedUserFromAuthRoute } = await loadServerAuthModule();
		mocks.cookiesMock.mockResolvedValue({
			get: vi.fn().mockReturnValue({ value: 'token' }),
		});
		mocks.getMock.mockResolvedValue({
			data: { pk: 1 },
			response: new Response(JSON.stringify({ pk: 1 }), { status: 200 }),
		});

		await expect(redirectAuthenticatedUserFromAuthRoute()).rejects.toThrow('REDIRECT:/');
	});

	it('allows auth routes when /me returns 401', async () => {
		const { redirectAuthenticatedUserFromAuthRoute } = await loadServerAuthModule();
		mocks.cookiesMock.mockResolvedValue({
			get: vi.fn().mockReturnValue({ value: 'token' }),
		});
		mocks.getMock.mockResolvedValue({
			data: undefined,
			response: new Response('unauthorized', { status: 401 }),
		});

		await expect(redirectAuthenticatedUserFromAuthRoute()).resolves.toBeUndefined();
		expect(mocks.redirectMock).not.toHaveBeenCalled();
	});

	it('skips auth-route verification without token cookie', async () => {
		const { redirectAuthenticatedUserFromAuthRoute } = await loadServerAuthModule();

		await expect(redirectAuthenticatedUserFromAuthRoute()).resolves.toBeUndefined();
		expect(mocks.getMock).not.toHaveBeenCalled();
		expect(mocks.redirectMock).not.toHaveBeenCalled();
	});
});
