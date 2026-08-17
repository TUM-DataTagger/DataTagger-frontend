import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { buildLoginHref, fallbackRedirectPath } from '@/util/authRedirect';
import { openAPIClient } from '@/util/fetch';
import { logger, LogCategory } from '@/util/logger';

type CurrentUserOptionalResult = {
	readonly status: number;
	readonly user: object | null;
};

export function buildLoginRedirectPath(nextTarget?: string | null) {
	return buildLoginHref(nextTarget);
}

export async function getCurrentUserOptional(): Promise<CurrentUserOptionalResult> {
	const { data, response } = await openAPIClient.GET('/api/v1/user/me/');

	if (response.status === 401) {
		return { user: null, status: response.status };
	}

	if (!response.ok || !data) {
		logger.error(LogCategory.Auth, 'Failed to fetch current user in server auth helper', {
			status: response.status,
			hasData: Boolean(data),
		});
		throw new Error('Failed to verify current user.');
	}

	return { user: data, status: response.status };
}

type RequireCurrentUserOrRedirectInput = {
	readonly nextTarget?: string | null;
};

export async function requireCurrentUserOrRedirect(input: RequireCurrentUserOrRedirectInput = {}) {
	const token = (await cookies()).get('token')?.value;
	if (!token) {
		redirect(buildLoginRedirectPath(input.nextTarget ?? fallbackRedirectPath));
	}

	const result = await getCurrentUserOptional();

	if (!result.user) {
		redirect(buildLoginRedirectPath(input.nextTarget ?? fallbackRedirectPath));
	}

	return result.user;
}

export async function redirectAuthenticatedUserFromAuthRoute() {
	const token = (await cookies()).get('token')?.value;
	if (!token) {
		return;
	}

	const result = await getCurrentUserOptional();

	if (result.user) {
		redirect(fallbackRedirectPath);
	}
}
