import { describe, expect, it } from 'vitest';
import {
	decodeRedirectCookieValue,
	getRedirectCookieOptions,
	getSafeRedirectTarget,
	isContentRoute,
	isPublicAuthRoute,
	shouldStoreRedirect,
	withSafeRedirectQuery,
} from '@/util/authRedirect';

describe('authRedirect', () => {
	it('matches public auth routes for exact, nested, and trailing-slash variants', () => {
		expect(isPublicAuthRoute('/login')).toBe(true);
		expect(isPublicAuthRoute('/login/')).toBe(true);
		expect(isPublicAuthRoute('/login/help')).toBe(true);
		expect(isPublicAuthRoute('/drafts')).toBe(false);
	});

	it('matches content routes for exact, nested, and trailing-slash variants', () => {
		expect(isContentRoute('/privacy-policy')).toBe(true);
		expect(isContentRoute('/privacy-policy/')).toBe(true);
		expect(isContentRoute('/privacy-policy/updates')).toBe(true);
		expect(isContentRoute('/projects')).toBe(false);
	});

	it('stores redirects only for non-blocked app routes', () => {
		expect(shouldStoreRedirect('/')).toBe(false);
		expect(shouldStoreRedirect('/login')).toBe(false);
		expect(shouldStoreRedirect('/auth-complete')).toBe(false);
		expect(shouldStoreRedirect('/privacy-policy')).toBe(false);
		expect(shouldStoreRedirect('/projects/123')).toBe(true);
	});

	it('accepts only safe internal redirect targets and strips fragments', () => {
		expect(getSafeRedirectTarget('/projects/1?tab=files#section')).toBe('/projects/1?tab=files');
		expect(getSafeRedirectTarget('//evil.com/path')).toBeNull();
		expect(getSafeRedirectTarget('https://evil.com/path')).toBeNull();
		expect(getSafeRedirectTarget('/login')).toBeNull();
		expect(getSafeRedirectTarget('/auth-complete/result')).toBeNull();
	});

	it('decodes redirect cookie values and rejects malformed values', () => {
		expect(decodeRedirectCookieValue(encodeURIComponent('/projects/1?view=grid'))).toBe('/projects/1?view=grid');
		expect(decodeRedirectCookieValue('%E0%A4%A')).toBeNull();
		expect(decodeRedirectCookieValue(encodeURIComponent('//evil.com/path'))).toBeNull();
	});

	it('returns copy of redirect cookie options with expected invariants', () => {
		const first = getRedirectCookieOptions();
		const second = getRedirectCookieOptions();

		expect(first).toEqual({
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production',
		});
		expect(first).not.toBe(second);
	});

	it('appends only safe next targets to auth links', () => {
		expect(withSafeRedirectQuery('/external-login', '/projects/1?tab=files')).toBe(
			'/external-login?next=%2Fprojects%2F1%3Ftab%3Dfiles',
		);
		expect(withSafeRedirectQuery('/external-login', '/login')).toBe('/external-login');
		expect(withSafeRedirectQuery('/external-login', '//evil.com')).toBe('/external-login');
		expect(withSafeRedirectQuery('/external-login', null)).toBe('/external-login');
	});
});
