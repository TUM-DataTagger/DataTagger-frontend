import { NextResponse, type NextRequest } from 'next/server';
import {
	buildLoginHref,
	getSafeRedirectTarget,
	isContentRoute,
	isPublicAuthRoute,
	redirectQueryParam,
} from './util/authRedirect';
import { internalRedirect } from './util/internalRedirect';

function isNavigationRequest(request: NextRequest) {
	const destination = request.headers.get('sec-fetch-dest');
	if (destination) {
		return destination === 'document' || destination === 'nested-document';
	}

	const accept = request.headers.get('accept') ?? '';
	return accept.includes('text/html');
}

export async function proxy(request: NextRequest) {
	const currentPathWithSearch = `${request.nextUrl.pathname}${request.nextUrl.search}`;
	const visitingPublicRoute = isPublicAuthRoute(request.nextUrl.pathname);
	const visitingContentRoute = isContentRoute(request.nextUrl.pathname);

	if (visitingPublicRoute || visitingContentRoute) {
		return NextResponse.next();
	}

	if (request.cookies.has('token')) {
		return NextResponse.next();
	}

	if (!isNavigationRequest(request)) {
		return NextResponse.next();
	}

	const queryRedirect = getSafeRedirectTarget(request.nextUrl.searchParams.get(redirectQueryParam));
	const redirectTarget = queryRedirect ?? currentPathWithSearch;
	const loginPath = buildLoginHref(redirectTarget);

	return internalRedirect(request, loginPath);
}

export const config = {
	matcher: [
		'/((?!api|_next/static|_next/image|favicon.ico|android-chrome-192x192.png|android-chrome-512x512.png|apple-touch-icon.png|browserconfig.xml|favicon-16x16.png|favicon-32x32.png|mstile-150x150.png|safari-pinned-tab.svg|site.webmanifest|manifest.webmanifest).*)',
	],
};
