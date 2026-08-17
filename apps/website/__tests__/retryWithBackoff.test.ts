import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRateLimitHandler, retryWithBackoff } from '@/util/retryWithBackoff';

describe('retryWithBackoff', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('retries until the operation succeeds with exponential delays', async () => {
		const operation = vi
			.fn<() => Promise<string>>()
			.mockRejectedValueOnce(new Error('first'))
			.mockRejectedValueOnce(new Error('second'))
			.mockResolvedValueOnce('ok');

		const promise = retryWithBackoff(operation, {
			baseDelay: 10,
			maxRetries: 5,
		});

		await vi.advanceTimersByTimeAsync(30);
		await expect(promise).resolves.toBe('ok');
		expect(operation).toHaveBeenCalledTimes(3);
	});

	it('stops immediately when shouldRetry returns false', async () => {
		const operation = vi.fn<() => Promise<string>>().mockRejectedValue(new Error('fatal'));
		const shouldRetry = vi.fn().mockReturnValue(false);

		await expect(
			retryWithBackoff(operation, {
				shouldRetry,
				maxRetries: 5,
			}),
		).rejects.toThrow('fatal');

		expect(operation).toHaveBeenCalledTimes(1);
		expect(shouldRetry).toHaveBeenCalledTimes(1);
	});

	it('throws on final retry attempt', async () => {
		const operation = vi.fn<() => Promise<string>>().mockRejectedValue(new Error('always-fails'));
		const promise = retryWithBackoff(operation, {
			baseDelay: 5,
			maxRetries: 2,
		});
		const rejection = expect(promise).rejects.toThrow('always-fails');

		await vi.advanceTimersByTimeAsync(5);
		await rejection;
		expect(operation).toHaveBeenCalledTimes(2);
	});
});

describe('createRateLimitHandler', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('returns original response when status is not 429', async () => {
		const handler = createRateLimitHandler();
		const response = new Response('ok', { status: 200 });
		const request = new Request('https://fdm.local/api/v1/project/', { method: 'GET' });

		const result = await handler({ request, response });
		expect(result).toBe(response);
	});

	it('retries 429 responses and returns the first non-429 response', async () => {
		const fetchMock = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(new Response('limited', { status: 429 }))
			.mockResolvedValueOnce(new Response('ok', { status: 200 }));
		vi.stubGlobal('fetch', fetchMock);

		const handler = createRateLimitHandler({
			baseDelay: 10,
			maxRetries: 5,
		});

		const initial = new Response('limited', {
			status: 429,
			headers: { 'Retry-After': '0' },
		});
		const request = new Request('https://fdm.local/api/v1/project/', { method: 'POST' });

		const promise = handler({ request, response: initial });
		await vi.advanceTimersByTimeAsync(30);
		const result = await promise;

		expect(result.status).toBe(200);
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('honors Retry-After when it exceeds exponential backoff delay', async () => {
		const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response('ok', { status: 200 }));
		vi.stubGlobal('fetch', fetchMock);
		const timeoutSpy = vi.spyOn(globalThis, 'setTimeout');

		const handler = createRateLimitHandler({
			baseDelay: 100,
			maxRetries: 3,
		});
		const initial = new Response('limited', {
			status: 429,
			headers: { 'Retry-After': '5' },
		});
		const request = new Request('https://fdm.local/api/v1/project/', { method: 'PATCH' });

		const promise = handler({ request, response: initial });
		await vi.advanceTimersByTimeAsync(5_000);
		await promise;

		expect(timeoutSpy).toHaveBeenCalled();
		const latestTimeoutCall = timeoutSpy.mock.calls.at(-1);
		expect(latestTimeoutCall?.[1]).toBe(5_000);
	});

	it('throws after reaching max retries on repeated 429 responses', async () => {
		const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response('limited', { status: 429 }));
		vi.stubGlobal('fetch', fetchMock);

		const handler = createRateLimitHandler({
			baseDelay: 10,
			maxRetries: 2,
		});
		const initial = new Response('limited', {
			status: 429,
			headers: { 'Retry-After': '0' },
		});
		const request = new Request('https://fdm.local/api/v1/project/', { method: 'DELETE' });

		const promise = handler({ request, response: initial });
		const rejection = expect(promise).rejects.toThrow('Max retries reached for rate limiting');
		await vi.advanceTimersByTimeAsync(30);
		await rejection;
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});
});
