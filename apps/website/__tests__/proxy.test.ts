import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { config, proxy } from '@/proxy';

describe('proxy', () => {
	it('redirects unauthenticated protected document requests to login with next', async () => {
		const request = new NextRequest('http://0.0.0.0:3000/projects/123?tab=files', {
			headers: {
				'x-forwarded-host': 'app.example.test',
				'x-forwarded-proto': 'https',
				accept: 'text/html',
			},
		});

		const response = await proxy(request);

		expect(response.status).toBe(307);
		expect(response.headers.get('location')).toBe(
			'https://app.example.test/login?next=%2Fprojects%2F123%3Ftab%3Dfiles',
		);
	});

	it('passes through public auth routes even when a token cookie exists', async () => {
		const request = new NextRequest('https://app.example.test/login', {
			headers: {
				cookie: 'token=stale-token',
			},
		});

		const response = await proxy(request);

		expect(response.status).toBe(200);
		expect(response.headers.get('location')).toBeNull();
		expect(response.headers.get('x-middleware-next')).toBe('1');
	});

	it('passes through protected non-document requests when unauthenticated', async () => {
		const request = new NextRequest('https://app.example.test/projects/123', {
			headers: {
				accept: 'application/json',
			},
		});

		const response = await proxy(request);

		expect(response.status).toBe(200);
		expect(response.headers.get('location')).toBeNull();
		expect(response.headers.get('x-middleware-next')).toBe('1');
	});

	it('does not assume token presence means authenticated for protected routes', async () => {
		const request = new NextRequest('https://app.example.test/projects/123?tab=files', {
			headers: {
				cookie: 'token=stale-token',
				accept: 'text/html',
			},
		});

		const response = await proxy(request);

		expect(response.status).toBe(200);
		expect(response.headers.get('location')).toBeNull();
		expect(response.headers.get('x-middleware-next')).toBe('1');
	});

	it('keeps manifest.webmanifest excluded in matcher config', () => {
		expect(config.matcher[0]).toContain('manifest.webmanifest');
	});
});
