import { NextResponse, type NextRequest } from 'next/server';

function assertInternalPath(path: string) {
	if (!path.startsWith('/') || path.startsWith('//')) {
		throw new Error(`Expected app-relative redirect path, received: ${path}`);
	}
}

function firstHeaderValue(value: string | null) {
	if (!value) {
		return null;
	}

	const firstValue = value.split(',', 1)[0]?.trim();

	return firstValue && firstValue.length > 0 ? firstValue : null;
}

function getForwardedParam(forwardedHeader: string | null, key: 'host' | 'proto') {
	const firstForwarded = firstHeaderValue(forwardedHeader);
	if (!firstForwarded) {
		return null;
	}

	const match = new RegExp(`(?:^|;)\\s*${key}=("?)([^";]+)\\1`, 'i').exec(firstForwarded);
	return match?.[2]?.trim() ?? null;
}

function hasExplicitPort(host: string) {
	if (host.startsWith('[')) {
		return host.includes(']:');
	}

	return host.includes(':');
}

function buildRedirectUrl(request: NextRequest, path: string) {
	const redirectUrl = new URL(path, request.url);
	const forwardedHost =
		firstHeaderValue(request.headers.get('x-forwarded-host')) ??
		getForwardedParam(request.headers.get('forwarded'), 'host');
	const forwardedProto =
		firstHeaderValue(request.headers.get('x-forwarded-proto')) ??
		getForwardedParam(request.headers.get('forwarded'), 'proto');
	const host = firstHeaderValue(request.headers.get('host'));

	const resolvedHost = forwardedHost ?? host;
	if (resolvedHost) {
		redirectUrl.host = resolvedHost;

		if (!hasExplicitPort(resolvedHost)) {
			redirectUrl.port = '';
		}
	}

	if (forwardedProto) {
		redirectUrl.protocol = `${forwardedProto}:`;
	} else if (process.env.NODE_ENV === 'production' && resolvedHost && redirectUrl.protocol === 'http:') {
		// Some reverse proxies forward host but omit x-forwarded-proto on non-document requests.
		// Prefer HTTPS in production to avoid mixed-content redirects.
		redirectUrl.protocol = 'https:';
	}

	return redirectUrl;
}

export function internalRedirect(request: NextRequest, path: string, init?: number | ResponseInit) {
	assertInternalPath(path);

	// Reverse proxies may forward requests to an internal host (for example 0.0.0.0:3000).
	// Rebuild redirects from forwarded headers so Location points at the public origin.
	return NextResponse.redirect(buildRedirectUrl(request, path), init);
}
