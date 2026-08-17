import { NextResponse, type NextRequest } from 'next/server';
import { getRedirectCookieOptions, getSafeRedirectTarget, redirectCookieName } from '@/util/authRedirect';
import { openAPIClient } from '@/util/fetch';
import { internalRedirect } from '@/util/internalRedirect';
import { logger, LogCategory } from '@/util/logger';

export async function GET(request: NextRequest) {
	const nextTarget = getSafeRedirectTarget(request.nextUrl.searchParams.get('next'));
	const { data, error, response } = await openAPIClient.GET('/api/v1/shibboleth/start/');

	if (error || !response.ok || !data?.shibboleth_login_url) {
		logger.warn(LogCategory.Auth, 'Failed to start Shibboleth login from local bootstrap route', {
			status: response.status,
			hasLoginUrl: Boolean(data?.shibboleth_login_url),
		});
		return internalRedirect(request, '/login');
	}

	const redirectResponse = NextResponse.redirect(new URL(data.shibboleth_login_url));

	if (nextTarget) {
		redirectResponse.cookies.set(redirectCookieName, encodeURIComponent(nextTarget), getRedirectCookieOptions());
	}

	return redirectResponse;
}
