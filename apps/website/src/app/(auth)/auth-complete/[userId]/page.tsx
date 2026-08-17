import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { decodeRedirectCookieValue, fallbackRedirectPath, redirectCookieName } from '@/util/authRedirect';

export default async function Page() {
	const cookieStore = await cookies();
	const redirectTarget = decodeRedirectCookieValue(cookieStore.get(redirectCookieName)?.value ?? null);

	if (!redirectTarget) {
		redirect(fallbackRedirectPath);
	}

	redirect(redirectTarget);
}
