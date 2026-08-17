import { logger, LogCategory } from '@/util/logger';

const publicAuthRoutes = [
	'/login',
	'/external-login',
	'/recover-password',
	'/recover-password/success',
	'/reset-password',
	'/auth/shibboleth-start',
] as const;

const contentRoutes = ['/privacy-policy', '/accessibility', '/terms-of-use', '/faq'] as const;

const redirectCookieName = 'redirectTo';
const redirectQueryParam = 'next';
const fallbackRedirectPath = '/';

const blockedRedirectRoutes = ['/', ...publicAuthRoutes, '/auth-complete'] as const;

const redirectCookieOptions = Object.freeze({
	path: '/',
	httpOnly: true,
	sameSite: 'lax' as const,
	secure: process.env.NODE_ENV === 'production',
});

function normalizeBasePath(pathname: string) {
	if (!pathname) {
		return '/';
	}

	const prefixed = pathname.startsWith('/') ? pathname : `/${pathname}`;
	return prefixed !== '/' && prefixed.endsWith('/') ? prefixed.slice(0, -1) : prefixed;
}

function stripFragment(target: string) {
	return target.split('#', 1)[0] ?? target;
}

function getRedirectBasePath(target: string) {
	const targetWithoutHash = stripFragment(target);
	const basePath = targetWithoutHash.split('?', 1)[0] ?? targetWithoutHash;
	return normalizeBasePath(basePath);
}

function startsWithRoute(pathname: string, route: string) {
	return pathname === route || pathname.startsWith(`${route}/`);
}

function isBlockedRedirectPath(pathname: string) {
	const normalized = normalizeBasePath(pathname);
	return blockedRedirectRoutes.some((route) => startsWithRoute(normalized, normalizeBasePath(route)));
}

export function isPublicAuthRoute(pathname: string) {
	return publicAuthRoutes.some((route) => startsWithRoute(normalizeBasePath(pathname), normalizeBasePath(route)));
}

export function isContentRoute(pathname: string) {
	return contentRoutes.some((route) => startsWithRoute(normalizeBasePath(pathname), normalizeBasePath(route)));
}

export function shouldStoreRedirect(pathname: string) {
	return !isPublicAuthRoute(pathname) && !isContentRoute(pathname) && !isBlockedRedirectPath(pathname);
}

export function getRedirectCookieOptions() {
	return { ...redirectCookieOptions };
}

export function getSafeRedirectTarget(target?: string | null) {
	if (!target) {
		return null;
	}

	if (!target.startsWith('/') || target.startsWith('//')) {
		return null;
	}

	const basePath = getRedirectBasePath(target);

	if (isBlockedRedirectPath(basePath)) {
		return null;
	}

	return stripFragment(target);
}

export function withSafeRedirectQuery(pathname: string, target?: string | null) {
	const safeTarget = getSafeRedirectTarget(target);
	if (!safeTarget) {
		return pathname;
	}

	const searchParams = new URLSearchParams({ [redirectQueryParam]: safeTarget });
	return `${pathname}?${searchParams.toString()}`;
}

export function buildLoginHref(target?: string | null) {
	return withSafeRedirectQuery('/login', target);
}

export function decodeRedirectCookieValue(value?: string | null) {
	if (!value) {
		return null;
	}

	try {
		const decoded = decodeURIComponent(value);
		return getSafeRedirectTarget(decoded);
	} catch (error) {
		logger.warn(LogCategory.Auth, 'Cookie decode failed', { error });
		return null;
	}
}

export { contentRoutes, fallbackRedirectPath, publicAuthRoutes, redirectCookieName, redirectQueryParam };
