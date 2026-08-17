import { logger, LogCategory } from '@/util/logger';

type RetryConfig = {
	/**
	 * Base delay multiplier in milliseconds (default: 1000)
	 */
	readonly baseDelay?: number;
	/**
	 * Maximum delay in milliseconds (default: 30000)
	 */
	readonly maxDelay?: number;
	/**
	 * Maximum number of retry attempts (default: 5)
	 */
	readonly maxRetries?: number;
};

const DEFAULT_CONFIG: Required<RetryConfig> = {
	maxRetries: 5,
	maxDelay: 30_000,
	baseDelay: 1_000,
};

/**
 * Calculates exponential backoff delay with optional server-specified retry-after
 */
function calculateDelay(attemptNumber: number, retryAfterSeconds: number, config: Required<RetryConfig>): number {
	const exponentialDelay = Math.min(2 ** attemptNumber * config.baseDelay, config.maxDelay);
	const serverDelay = retryAfterSeconds * 1_000;
	return Math.max(serverDelay, exponentialDelay);
}

/**
 * Creates an openapi-fetch middleware handler for rate limiting (429) responses.
 *
 * Implements exponential backoff with configurable retry limits and respects
 * server-specified Retry-After headers.
 *
 * @example
 * ```ts
 * openAPIClient.use({
 *   onResponse: createRateLimitHandler({ maxRetries: 3 }),
 * });
 * ```
 */
export function createRateLimitHandler(config: RetryConfig = {}) {
	const resolvedConfig = { ...DEFAULT_CONFIG, ...config };

	return async ({ request, response }: { request: Request; response: Response }): Promise<Response> => {
		if (response.status !== 429) {
			return response;
		}

		const retryAfter = Number.parseInt(response.headers.get('Retry-After') ?? '1', 10);
		let retryCount = 0;

		logger.debug(LogCategory.RateLimiter, 'Rate limit detected', { url: request.url, retryAfter });

		const attemptRetry = async (): Promise<Response> => {
			if (retryCount >= resolvedConfig.maxRetries) {
				logger.error(LogCategory.RateLimiter, 'Max retries reached', { url: request.url, attempts: retryCount });
				throw new Error('Max retries reached for rate limiting');
			}

			const delay = calculateDelay(retryCount, retryAfter, resolvedConfig);
			logger.debug(LogCategory.RateLimiter, `Retrying in ${delay}ms`, {
				attempt: retryCount + 1,
				maxRetries: resolvedConfig.maxRetries,
			});

			await new Promise<void>((resolve) => {
				setTimeout(resolve, delay);
			});

			retryCount++;

			const retryResponse = await fetch(request.url, {
				method: request.method,
				headers: request.headers,
				body: request.body,
			});

			if (retryResponse.status === 429) {
				return attemptRetry();
			}

			logger.debug(LogCategory.RateLimiter, 'Request succeeded after retry', {
				url: request.url,
				attempts: retryCount,
			});
			return retryResponse;
		};

		return attemptRetry();
	};
}

/**
 * Standalone retry function for non-fetch operations
 *
 * @example
 * ```ts
 * const result = await retryWithBackoff(
 *   () => someAsyncOperation(),
 *   { maxRetries: 3 }
 * );
 * ```
 */
export async function retryWithBackoff<Result>(
	operation: () => Promise<Result>,
	config: RetryConfig & { shouldRetry?(error: unknown): boolean } = {},
): Promise<Result> {
	const resolvedConfig = { ...DEFAULT_CONFIG, ...config };
	// eslint-disable-next-line @typescript-eslint/unbound-method
	const shouldRetry = config.shouldRetry ?? (() => true);
	let lastError: unknown;

	for (let attempt = 0; attempt < resolvedConfig.maxRetries; attempt++) {
		try {
			return await operation();
		} catch (error) {
			lastError = error;

			if (!shouldRetry(error) || attempt === resolvedConfig.maxRetries - 1) {
				throw error;
			}

			const delay = calculateDelay(attempt, 0, resolvedConfig);
			logger.debug(LogCategory.RateLimiter, `Retrying in ${delay}ms`, {
				attempt: attempt + 1,
				maxRetries: resolvedConfig.maxRetries,
			});

			await new Promise<void>((resolve) => {
				setTimeout(resolve, delay);
			});
		}
	}

	throw lastError;
}
