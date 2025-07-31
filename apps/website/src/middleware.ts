import { NextResponse, type NextRequest } from 'next/server';
// import { ENV } from './utils/env';

const publicRoutes = ['/login', '/external-login', '/recover-password', '/recover-password/success', '/reset-password'];

const contentRoutes = ['/privacy-policy', '/accessibility', '/terms-of-use', '/faq'];

function deleteSessionCookie(req: NextRequest) {
	const response = NextResponse.redirect(new URL('/login', req.url));
	response.cookies.delete('token');
	return response;
}

export async function middleware(request: NextRequest) {
	if (request.cookies.has('token')) {
		try {
			// const response = await fetch(`${ENV.BASE_API_URL}/api/v1/authverify/`, {
			// 	method: 'POST',
			// 	headers: {
			// 		'Content-Type': 'application/json',
			// 	},
			// 	body: JSON.stringify({
			// 		token: request.cookies.get('token')!.value,
			// 	}),
			// });
			// if (!response.ok) {
			// 	console.log('Response not ok:', response.status, response.statusText);
			// 	console.log(await response.json());
			// 	return deleteSessionCookie(request);
			// }
		} catch (error) {
			console.log('Error:', error);
			return deleteSessionCookie(request);
		}

		if (publicRoutes.some((route) => request.nextUrl.pathname.startsWith(route))) {
			return NextResponse.redirect(new URL('/drafts', request.url));
		}

		return NextResponse.next();
	} else if ([...publicRoutes, ...contentRoutes].some((route) => request.nextUrl.pathname.startsWith(route))) {
		return NextResponse.next();
	}

	return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
	matcher: [
		'/((?!api|_next/static|_next/image|favicon.ico|android-chrome-192x192.png|android-chrome-512x512.png|apple-touch-icon.png|browserconfig.xml|favicon-16x16.png|favicon-32x32.png|mstile-150x150.png|safari-pinned-tab.svg|site.webmanifest).*)',
	],
};
