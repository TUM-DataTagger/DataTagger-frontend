import { cookies } from 'next/headers';
import createClient from 'openapi-fetch';
import createReactQueryClient from 'openapi-react-query';
import { ENV } from '@/util/env';
import type { paths } from '@/util/openapiSchema';

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
	async onResponse({ request, response }) {
		if (response.status === 429) {
			console.log('Rate limiting detected');

			const retryAfter = Number.parseInt(response.headers.get('Retry-After') ?? '1', 10);
			const maxRetries = 5;
			let retryCount = 0;

			console.log('Retry count:', retryCount);

			const retryWithBackoff = async () => {
				if (retryCount >= maxRetries) {
					throw new Error('Max retries reached for rate limiting');
				}

				// Max delay of 30 seconds
				const delay = Math.min(2 ** retryCount * 1_000, 30_000);
				await new Promise<void>((resolve) => {
					setTimeout(resolve, Math.max(retryAfter * 1_000, delay));
				});

				retryCount++;
				const retryResponse = await fetch(request.url, {
					method: request.method,
					headers: request.headers,
					body: request.body,
				});

				if (retryResponse.status === 429) {
					return retryWithBackoff();
				}

				return retryResponse;
			};

			return retryWithBackoff();
		}

		return response;
	},
});

const $api = createReactQueryClient(openAPIClient);

export { $api, openAPIClient };
