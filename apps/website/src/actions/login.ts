'use server';

import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { cookies } from 'next/headers';
import setCookieParser from 'set-cookie-parser';
import { ValiError, parse } from 'valibot';
import { LoginSchema } from '@/schemas/LoginSchema';
import { error, isFetchError, ok, type ActionResult } from '@/util/actions';
import { openAPIClient } from '@/util/fetch';

export async function login(_: ActionResult<void>, formData: FormData): Promise<ActionResult<string | undefined>> {
	try {
		const { email, password } = parse(LoginSchema, {
			email: formData.get('email'),
			password: formData.get('password'),
		});

		const { data: authData, response } = await openAPIClient.POST('/api/v1/auth/', {
			body: { email, password },
		});

		if (response.status === 400) {
			return error({ root: 'Invalid login credentials. Please check your entries.' });
		}

		const parsedCookies = setCookieParser(response.headers.getSetCookie() ?? []);
		for (const cookie of parsedCookies) {
			(await cookies()).set(cookie.name, cookie.value, {
				path: cookie.path,
				expires: cookie.expires,
				httpOnly: cookie.httpOnly,
				domain: cookie.domain,
				secure: cookie.secure,
				sameSite: cookie.sameSite as boolean | 'lax' | 'none' | 'strict' | undefined,
				maxAge: cookie.maxAge,
			});
		}

		return ok(authData?.token);
	} catch (error_) {
		if (isRedirectError(error_)) {
			throw error_;
		}

		if (isFetchError(error_)) {
			return error({ root: 'Failed to connect to the server. Please try again later.' });
		}

		if (error_ instanceof ValiError) {
			return error(error_);
		}

		return error(error_);
	}
}
