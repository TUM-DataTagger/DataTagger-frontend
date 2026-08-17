// @vitest-environment happy-dom

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useWebSocketConnectionInternal } from '@/hooks/useWebSocketConnection';
import { logger } from '@/util/logger';
import { handleSessionExpiry } from '@/util/sessionExpiry';

vi.mock('@/util/logger', () => ({
	LogCategory: { WebSocket: 'WebSocket' },
	logger: {
		debug: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
	},
}));

vi.mock('@/util/sessionExpiry', () => ({
	handleSessionExpiry: vi.fn(),
}));

class MockWebSocket {
	public static CONNECTING = 0;
	public static OPEN = 1;
	public static CLOSING = 2;
	public static CLOSED = 3;
	public static instances: MockWebSocket[] = [];

	public readonly close = vi.fn((code?: number, reason?: string) => {
		this.readyState = MockWebSocket.CLOSING;
		this.emitClose(code ?? 1_000, reason ?? '');
	});
	public readonly send = vi.fn();
	public readonly url: string;

	public onclose: ((event: CloseEvent) => void) | null = null;
	public onerror: ((event: Event) => void) | null = null;
	public onmessage: ((event: MessageEvent) => void) | null = null;
	public onopen: ((event: Event) => void) | null = null;
	public readyState = MockWebSocket.CONNECTING;

	public constructor(url: string) {
		this.url = url;
		MockWebSocket.instances.push(this);
	}

	public emitOpen() {
		this.readyState = MockWebSocket.OPEN;
		this.onopen?.(new Event('open'));
	}

	public emitMessage(data: string) {
		this.onmessage?.({ data } as MessageEvent);
	}

	public emitClose(code = 1_006, reason = 'closed') {
		this.readyState = MockWebSocket.CLOSED;
		this.onclose?.({ code, reason } as CloseEvent);
	}

	public emitError(event: Event) {
		this.onerror?.(event);
	}
}

describe('useWebSocketConnectionInternal', () => {
	beforeEach(() => {
		MockWebSocket.instances = [];
		vi.stubGlobal('WebSocket', MockWebSocket as unknown as typeof WebSocket);
		vi.useFakeTimers();
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	it('connects and sends auth payload on open', () => {
		renderHook(() =>
			useWebSocketConnectionInternal({
				url: 'ws://localhost/ws',
				token: 'token-123',
			}),
		);

		const socket = MockWebSocket.instances[0];
		expect(socket).toBeDefined();

		act(() => {
			socket!.emitOpen();
		});

		expect(socket!.send).toHaveBeenCalledWith(JSON.stringify({ authorization: 'token-123' }));
	});

	it('auth_success marks ready and resets reconnect attempts', () => {
		const { result } = renderHook(() =>
			useWebSocketConnectionInternal({
				url: 'ws://localhost/ws',
				token: 'token-123',
				reconnectInterval: 100,
			}),
		);

		const socket = MockWebSocket.instances[0];
		expect(socket).toBeDefined();

		act(() => {
			socket!.emitOpen();
			socket!.emitMessage(JSON.stringify({ type: 'auth_success', data: {} }));
		});
		expect(result.current.ready).toBe(true);

		act(() => {
			socket!.emitClose(1_006, 'disconnect');
		});
		act(() => {
			vi.advanceTimersByTime(100);
		});

		act(() => {
			socket!.emitMessage(JSON.stringify({ type: 'auth_success', data: {} }));
		});

		expect(result.current.ready).toBe(true);
		expect(result.current.reconnectAttempts).toBe(0);
	});

	it('auth_error sets auth error and closes socket', () => {
		const { result } = renderHook(() =>
			useWebSocketConnectionInternal({
				url: 'ws://localhost/ws',
				token: 'token-123',
			}),
		);

		const socket = MockWebSocket.instances[0];
		expect(socket).toBeDefined();

		act(() => {
			socket!.emitMessage(JSON.stringify({ type: 'auth_error', data: {} }));
		});

		expect(result.current.error).toMatchObject({
			type: 'auth',
			message: 'WebSocket authentication failed',
		});
		expect(vi.mocked(handleSessionExpiry)).toHaveBeenCalledWith({ source: 'websocket_auth_error' });
		expect(socket!.close).toHaveBeenCalled();
	});

	it('sets parse error when incoming message is invalid JSON', () => {
		const { result } = renderHook(() =>
			useWebSocketConnectionInternal({
				url: 'ws://localhost/ws',
				token: 'token-123',
			}),
		);

		const socket = MockWebSocket.instances[0];
		expect(socket).toBeDefined();

		act(() => {
			socket!.emitMessage('{not-json}');
		});

		expect(result.current.error).toMatchObject({
			type: 'parse',
			message: 'Failed to parse WebSocket message',
		});
	});

	it('schedules reconnect with backoff and stops at max reconnect attempts', () => {
		const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
		const { result } = renderHook(() =>
			useWebSocketConnectionInternal({
				url: 'ws://localhost/ws',
				token: 'token-123',
				reconnectInterval: 200,
				maxReconnectAttempts: 1,
			}),
		);

		const socket = MockWebSocket.instances[0];
		expect(socket).toBeDefined();

		act(() => {
			socket!.emitClose(1_006, 'disconnect');
		});
		expect(setTimeoutSpy).toHaveBeenLastCalledWith(expect.any(Function), 200);

		act(() => {
			vi.advanceTimersByTime(200);
		});

		act(() => {
			socket!.emitClose(1_006, 'disconnect again');
		});

		expect(result.current.error).toMatchObject({
			type: 'max_reconnects',
			message: 'Max reconnect attempts reached. Please refresh the page.',
		});
	});

	it('cleanup closes socket with code 1000 and suppresses spurious error handling', () => {
		const { unmount } = renderHook(() =>
			useWebSocketConnectionInternal({
				url: 'ws://localhost/ws',
				token: 'token-123',
			}),
		);

		const socket = MockWebSocket.instances[0];
		expect(socket).toBeDefined();

		unmount();

		expect(socket!.close).toHaveBeenCalledWith(1_000, 'Component unmounted');

		act(() => {
			socket!.emitError(new Event('error'));
		});

		expect(vi.mocked(logger.error)).not.toHaveBeenCalledWith(
			'WebSocket',
			'Connection error',
			expect.objectContaining({ error: expect.anything() }),
		);
	});
});
