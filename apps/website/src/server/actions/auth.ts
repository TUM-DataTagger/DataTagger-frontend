'use server';

import { ORPCError } from '@orpc/server';
import { redirect } from 'next/navigation';
import { email, nonEmpty, nullable, object, optional, pipe, string } from 'valibot';
import { proc } from '@/server/proc';
import { fallbackRedirectPath, getSafeRedirectTarget } from '@/util/authRedirect';
import { openAPIClient } from '@/util/fetch';
import { logger, LogCategory } from '@/util/logger';

const LoginSchema = object({
	email: pipe(
		string('Please enter a valid email address'),
		email('Please enter a valid email address'),
		nonEmpty('Please enter a valid email address'),
	),
	password: pipe(string('Please enter your password'), nonEmpty('Please enter your password')),
	next: optional(nullable(string())),
});

export const login = proc
	.input(LoginSchema)
	.handler(async ({ input, context }) => {
		const {
			data,
			error: backendError,
			response,
		} = await openAPIClient.POST('/api/v1/auth/', {
			// @ts-expect-error - this is correctly typed, but openAPIClient's types are currently broken
			body: { email: input.email, password: input.password },
		});

		if (response.status === 400) {
			logger.info(LogCategory.Auth, 'External login failed due to invalid credentials');
			// Must be ORPCError, not Error: oRPC's actionable() wraps any non-ORPCError throw
			// as INTERNAL_SERVER_ERROR with message "Internal server error", clobbering ours.
			throw new ORPCError('UNAUTHORIZED', {
				message: 'Invalid login credentials. Please check your entries.',
				data: { backendStatus: response.status, backendBody: backendError ?? data ?? null },
			});
		}

		if (!response.ok || !data?.token) {
			logger.error(LogCategory.Auth, 'External login failed', {
				status: response.status,
				hasToken: Boolean(data?.token),
			});
			throw new ORPCError('INTERNAL_SERVER_ERROR', {
				message: 'Login failed. Please try again.',
				data: { backendStatus: response.status, backendBody: backendError ?? data ?? null },
			});
		}

		context.cookies.set('token', data.token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production',
		});

		const redirectTo = getSafeRedirectTarget(input.next) ?? fallbackRedirectPath;
		logger.info(LogCategory.Auth, 'External login successful', { redirectTo });

		return { redirectTo };
	})
	.actionable();

export const logout = proc
	.handler(async ({ context }) => {
		logger.info(LogCategory.Auth, 'Logout performed');
		context.cookies.delete('token');
		redirect('/');
	})
	.actionable();
