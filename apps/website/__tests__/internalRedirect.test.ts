import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { internalRedirect } from '@/util/internalRedirect';

describe('internalRedirect', () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it('uses forwarded proto/host when present', () => {
		const request = new NextRequest('http://0.0.0.0:3000/protected', {
			headers: {
				'x-forwarded-host': 'app.example.com',
				'x-forwarded-proto': 'https',
			},
		});

		const response = internalRedirect(request, '/login');

		expect(response.headers.get('location')).toBe('https://app.example.com/login');
	});

	it('falls back to https in production when only host is available', () => {
		vi.stubEnv('NODE_ENV', 'production');

		const request = new NextRequest('http://0.0.0.0:3000/protected', {
			headers: {
				host: 'app.example.com',
			},
		});

		const response = internalRedirect(request, '/login');

		expect(response.headers.get('location')).toBe('https://app.example.com/login');
	});
});
