import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	postMock: vi.fn(),
	cookiesSetMock: vi.fn(),
	cookiesMock: vi.fn(),
	headersMock: vi.fn(),
	loggerInfoMock: vi.fn(),
	loggerErrorMock: vi.fn(),
}));

vi.mock('next/headers', () => ({
	cookies: mocks.cookiesMock,
	headers: mocks.headersMock,
}));

vi.mock('@/util/fetch', () => ({
	openAPIClient: {
		POST: mocks.postMock,
	},
}));

vi.mock('@/util/logger', () => ({
	LogCategory: { Auth: 'Auth' },
	logger: {
		info: mocks.loggerInfoMock,
		error: mocks.loggerErrorMock,
	},
}));

async function loadLoginAction() {
	vi.resetModules();
	return import('@/server/actions/auth');
}

describe('login server action', () => {
	beforeEach(() => {
		mocks.postMock.mockReset();
		mocks.cookiesSetMock.mockReset();
		mocks.cookiesMock.mockReset();
		mocks.headersMock.mockReset();
		mocks.loggerInfoMock.mockReset();
		mocks.loggerErrorMock.mockReset();
		mocks.cookiesMock.mockResolvedValue({ set: mocks.cookiesSetMock });
		mocks.headersMock.mockResolvedValue(new Headers());
	});

	it('returns a UNAUTHORIZED orpc error with curated message and backend details when backend responds 400', async () => {
		const backendBody = { detail: 'Invalid credentials' };
		mocks.postMock.mockResolvedValue({
			data: undefined,
			error: backendBody,
			response: new Response(null, { status: 400 }),
		});

		const { login } = await loadLoginAction();
		const [error, data] = await login({ email: 'user@example.test', password: 'wrong' });

		expect(data).toBeUndefined();
		expect(error).toBeDefined();
		expect(error?.message).toBe('Invalid login credentials. Please check your entries.');
		expect(error?.code).toBe('UNAUTHORIZED');
		expect(error?.data).toEqual({ backendStatus: 400, backendBody });
	});

	it('returns an INTERNAL_SERVER_ERROR orpc error when backend responds 200 without a token', async () => {
		const backendBody = { not_a_token: 'oops' };
		mocks.postMock.mockResolvedValue({
			data: backendBody,
			error: undefined,
			response: new Response(null, { status: 200 }),
		});

		const { login } = await loadLoginAction();
		const [error, data] = await login({ email: 'user@example.test', password: 'correct' });

		expect(data).toBeUndefined();
		expect(error).toBeDefined();
		expect(error?.message).toBe('Login failed. Please try again.');
		expect(error?.code).toBe('INTERNAL_SERVER_ERROR');
		expect(error?.data).toEqual({ backendStatus: 200, backendBody });
	});

	it('sets the token cookie and returns redirectTo on successful login', async () => {
		mocks.postMock.mockResolvedValue({
			data: { token: 'jwt-token-value' },
			error: undefined,
			response: new Response(null, { status: 200 }),
		});

		const { login } = await loadLoginAction();
		const [error, data] = await login({
			email: 'user@example.test',
			password: 'correct',
			next: '/projects/42',
		});

		expect(error).toBeNull();
		expect(data).toEqual({ redirectTo: '/projects/42' });
		expect(mocks.cookiesSetMock).toHaveBeenCalledWith(
			'token',
			'jwt-token-value',
			expect.objectContaining({ httpOnly: true, path: '/', sameSite: 'lax' }),
		);
	});

	it('returns an INTERNAL_SERVER_ERROR orpc error with backend details when backend responds 5xx', async () => {
		const backendBody = { detail: 'Service unavailable' };
		mocks.postMock.mockResolvedValue({
			data: undefined,
			error: backendBody,
			response: new Response(null, { status: 503 }),
		});

		const { login } = await loadLoginAction();
		const [error, data] = await login({ email: 'user@example.test', password: 'correct' });

		expect(data).toBeUndefined();
		expect(error).toBeDefined();
		expect(error?.message).toBe('Login failed. Please try again.');
		expect(error?.code).toBe('INTERNAL_SERVER_ERROR');
		expect(error?.data).toEqual({ backendStatus: 503, backendBody });
	});
});
