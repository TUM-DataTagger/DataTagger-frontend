import { isContentRoute, isPublicAuthRoute } from '@/util/authRedirect';

export type SessionExpiryRedirectSource = string;

export type SessionExpiryRedirectPolicyInput = {
	readonly currentPathname?: string;
	readonly requestPathname?: string;
	readonly source?: SessionExpiryRedirectSource;
};

const ignored401ExactRequestPaths = new Set([
	'/api/v1/auth',
	'/api/v1/authrefresh',
	'/api/v1/authverify',
	'/api/v1/shibboleth/start',
]);

function normalizePathname(pathname: string) {
	if (!pathname) {
		return '/';
	}

	const prefixed = pathname.startsWith('/') ? pathname : `/${pathname}`;

	if (prefixed === '/') {
		return prefixed;
	}

	return prefixed.endsWith('/') ? prefixed.slice(0, -1) : prefixed;
}

function isRoutePrefixMatch(pathname: string, route: string) {
	const normalizedPath = normalizePathname(pathname);
	const normalizedRoute = normalizePathname(route);

	return normalizedPath === normalizedRoute || normalizedPath.startsWith(`${normalizedRoute}/`);
}

function shouldIgnore401ForRequestPath(requestPathname: string) {
	const normalizedPath = normalizePathname(requestPathname);

	if (ignored401ExactRequestPaths.has(normalizedPath)) {
		return true;
	}

	if (isRoutePrefixMatch(normalizedPath, '/api/v1/reset-password')) {
		return true;
	}

	return false;
}

function shouldSuppressOnCurrentPage(currentPathname: string) {
	const normalizedPath = normalizePathname(currentPathname);

	return isPublicAuthRoute(normalizedPath) || isContentRoute(normalizedPath);
}

export function shouldTriggerSessionExpiryRedirect(input: SessionExpiryRedirectPolicyInput = {}) {
	if (input.currentPathname && shouldSuppressOnCurrentPage(input.currentPathname)) {
		return false;
	}

	if (input.requestPathname && shouldIgnore401ForRequestPath(input.requestPathname)) {
		return false;
	}

	return true;
}
