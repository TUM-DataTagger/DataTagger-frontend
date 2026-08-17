import { cookies } from 'next/headers';
import createClient from 'openapi-fetch';
import createReactQueryClient from 'openapi-react-query';
import { ENV } from '@/util/env';
import type { paths } from '@/util/openapiSchema';
import { createRateLimitHandler } from '@/util/retryWithBackoff';

const openAPIClient = createClient<paths>({
	baseUrl: ENV.BASE_API_URL,
});

openAPIClient.use({
	async onRequest({ request }) {
		const token = (await cookies()).get('token')?.value;
		if (token) {
			request.headers.set('authorization', `Bearer ${token}`);
		}

		return request;
	},
	onResponse: createRateLimitHandler(),
});

const $api = createReactQueryClient(openAPIClient);

export { $api, openAPIClient };
