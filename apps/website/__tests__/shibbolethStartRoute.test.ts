import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	getMock: vi.fn(),
	loggerWarnMock: vi.fn(),
}));

vi.mock('@/util/fetch', () => ({
	openAPIClient: {
		GET: mocks.getMock,
	},
}));

vi.mock('@/util/logger', () => ({
	LogCategory: { Auth: 'Auth' },
	logger: {
		warn: mocks.loggerWarnMock,
	},
}));

async function loadRouteModule() {
	vi.resetModules();
	return import('@/app/auth/shibboleth-start/route');
}

describe('GET /auth/shibboleth-start', () => {
	beforeEach(() => {
		mocks.getMock.mockReset();
		mocks.loggerWarnMock.mockReset();
	});

	it('sets redirect cookie for safe next targets and redirects to shibboleth login url', async () => {
		const { GET } = await loadRouteModule();
		mocks.getMock.mockResolvedValue({
			data: { shibboleth_login_url: 'https://idp.example.test/login' },
			error: undefined,
			response: new Response(null, { status: 200 }),
		});

		const request = new NextRequest('https://app.example.test/auth/shibboleth-start?next=%2Fprojects%2F123');
		const response = await GET(request);
		const setCookieHeader = response.headers.get('set-cookie') ?? '';

		expect(response.status).toBe(307);
		expect(response.headers.get('location')).toBe('https://idp.example.test/login');
		expect(setCookieHeader).toContain('redirectTo=%252Fprojects%252F123');
	});

	it('does not set redirect cookie for unsafe next targets', async () => {
		const { GET } = await loadRouteModule();
		mocks.getMock.mockResolvedValue({
			data: { shibboleth_login_url: 'https://idp.example.test/login' },
			error: undefined,
			response: new Response(null, { status: 200 }),
		});

		const request = new NextRequest('https://app.example.test/auth/shibboleth-start?next=%2F%2Fevil.com%2Fpath');
		const response = await GET(request);

		expect(response.status).toBe(307);
		expect(response.headers.get('location')).toBe('https://idp.example.test/login');
		expect(response.headers.get('set-cookie') ?? '').not.toContain('redirectTo=');
	});

	it('falls back to local login when backend bootstrap fails', async () => {
		const { GET } = await loadRouteModule();
		mocks.getMock.mockResolvedValue({
			data: undefined,
			error: { message: 'failed' },
			response: new Response(null, { status: 500 }),
		});

		const request = new NextRequest('http://0.0.0.0:3000/auth/shibboleth-start', {
			headers: {
				host: 'app.example.com',
			},
		});
		const response = await GET(request);

		expect(response.status).toBe(307);
		expect(response.headers.get('location')).toBe('http://app.example.com/login');
		expect(mocks.loggerWarnMock).toHaveBeenCalledTimes(1);
	});
});
