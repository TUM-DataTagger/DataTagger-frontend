import createClient from 'openapi-fetch';
import createReactQueryClient from 'openapi-react-query';
import { logger, LogCategory } from '@/util/logger';
import type { paths } from '@/util/openapiSchema';
import { recordRecentActivity } from '@/util/recentActivity';
import { classifyRecentMutation, shouldInspectRecentMutation } from '@/util/recentActivityMatcher';
import { createRateLimitHandler } from '@/util/retryWithBackoff';
import { handleSessionExpiry } from '@/util/sessionExpiry';
import { shouldTriggerSessionExpiryRedirect } from '@/util/sessionExpiryPolicy';

const openAPIClient = createClient<paths>({
	baseUrl: process.env.NEXT_PUBLIC_BASE_API_URL ?? '',
	credentials: 'include',
});

openAPIClient.use({
	onResponse: createRateLimitHandler(),
});

openAPIClient.use({
	async onResponse({ request, response }) {
		if (response.status !== 401) {
			return response;
		}

		let pathname = '';
		try {
			pathname = new URL(request.url).pathname;
		} catch {
			return response;
		}

		const currentPathname = typeof window === 'undefined' ? undefined : window.location.pathname;
		if (
			!shouldTriggerSessionExpiryRedirect({ requestPathname: pathname, currentPathname, source: 'openapi_client_401' })
		) {
			return response;
		}

		handleSessionExpiry({
			source: 'openapi_client_401',
			requestUrl: request.url,
			status: response.status,
		});

		return response;
	},
});

openAPIClient.use({
	async onResponse({ request, response }) {
		if (typeof window === 'undefined') {
			return response;
		}

		if (!response.ok) {
			return response;
		}

		const method = request.method.toUpperCase();
		if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
			return response;
		}

		let pathname = '';
		try {
			pathname = new URL(request.url).pathname;
		} catch {
			return response;
		}

		if (!shouldInspectRecentMutation(pathname, method)) {
			return response;
		}

		let responseData: unknown = null;
		if (response.headers.get('content-type')?.includes('application/json')) {
			try {
				responseData = await response.clone().json();
			} catch {
				responseData = null;
			}
		}

		try {
			const activityEvent = classifyRecentMutation({
				request,
				responseData,
			});

			if (activityEvent) {
				recordRecentActivity(activityEvent);
			}
		} catch (error) {
			logger.warn(LogCategory.Project, 'Failed to process recent activity mutation tracking middleware', {
				error: error instanceof Error ? error.message : String(error),
				method,
				pathname,
			});
		}

		return response;
	},
});

const $api = createReactQueryClient(openAPIClient);

export { $api, openAPIClient };
