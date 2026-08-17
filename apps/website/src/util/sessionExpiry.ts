import { getQueryClient } from '@/util/getQueryClient';
import { logger, LogCategory } from '@/util/logger';
import { shouldTriggerSessionExpiryRedirect } from '@/util/sessionExpiryPolicy';

type SessionExpiryHandlerInput = {
	readonly requestUrl?: string;
	readonly source?: string;
	readonly status?: number;
};

let hasTriggeredSessionExpiryRedirect = false;

export function shouldIgnore401ForSessionExpiry(pathname: string) {
	return !shouldTriggerSessionExpiryRedirect({
		requestPathname: pathname,
		source: 'openapi_client_401',
	});
}

export function buildSessionExpiredRedirectUrl(pathWithSearch: string) {
	const targetWithoutHash = pathWithSearch.split('#', 1)[0] ?? '';
	const safeTarget =
		targetWithoutHash.startsWith('/') && !targetWithoutHash.startsWith('//') && targetWithoutHash.length > 0
			? targetWithoutHash
			: '/';

	const searchParams = new URLSearchParams({ next: safeTarget });

	return `/login?${searchParams.toString()}`;
}

export function handleSessionExpiry(input: SessionExpiryHandlerInput = {}) {
	if (typeof window === 'undefined') {
		return;
	}

	const currentPathname = window.location.pathname;
	let requestPathname: string | undefined;
	if (input.requestUrl) {
		try {
			requestPathname = new URL(input.requestUrl, window.location.origin).pathname;
		} catch {
			requestPathname = undefined;
		}
	}

	// Defense-in-depth while callers are migrated to centralized policy checks.
	if (
		!shouldTriggerSessionExpiryRedirect({
			currentPathname,
			requestPathname,
			source: input.source,
		})
	) {
		return;
	}

	if (hasTriggeredSessionExpiryRedirect) {
		return;
	}

	hasTriggeredSessionExpiryRedirect = true;

	const currentPathWithSearch = `${currentPathname}${window.location.search}`;
	const redirectUrl = buildSessionExpiredRedirectUrl(currentPathWithSearch);

	logger.warn(LogCategory.Auth, 'Session expired, clearing client session and redirecting to login', {
		...input,
		redirectUrl,
	});

	getQueryClient().clear();
	window.location.assign(redirectUrl);
}
