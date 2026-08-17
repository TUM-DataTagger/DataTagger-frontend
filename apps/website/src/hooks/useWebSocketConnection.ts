import { useState, useRef, useEffect, useCallback } from 'react';
import { logger, LogCategory } from '@/util/logger';
import { handleSessionExpiry } from '@/util/sessionExpiry';

type WebSocketConfig = {
	readonly maxReconnectAttempts?: number;
	readonly reconnectInterval?: number;
	readonly token?: string | undefined;
	readonly url: string;
};

const DEFAULT_MAX_RECONNECT_ATTEMPTS = 10;
const DEFAULT_RECONNECT_INTERVAL = 3_000;

/**
 * WebSocket message types received from the server
 */
type WebSocketMessageType = 'auth_error' | 'auth_success' | 'error' | 'lock_status_changed' | 'notification' | 'update';

/**
 * Base structure for all WebSocket messages
 * The data type is flexible to accommodate different message types (lock status, notifications, etc.)
 */
type WebSocketMessage<Type = Record<string, unknown>> = {
	readonly data: Type & {
		readonly pk?: number | string;
		readonly status?: boolean;
		readonly user?: string;
	};
	readonly timestamp?: string;
	readonly type: WebSocketMessageType;
};

/**
 * Collection of messages organized by primary key
 */
export type MessagesCollection = {
	readonly [pk: string]: readonly WebSocketMessage[];
	readonly others: readonly WebSocketMessage[];
};

/**
 * WebSocket connection error types
 */
type WebSocketError = {
	readonly message: string;
	readonly originalError?: unknown;
	readonly type: 'auth' | 'connection' | 'max_reconnects' | 'parse';
};

/**
 * Internal hook that manages the WebSocket connection.
 * Use `useWebSocketConnection` from `@/contexts/WebSocket` instead for stable connection state,
 * or `useWebSocketMessages` for real-time message updates.
 */
export function useWebSocketConnectionInternal(config: WebSocketConfig) {
	const {
		url,
		token,
		reconnectInterval = DEFAULT_RECONNECT_INTERVAL,
		maxReconnectAttempts = DEFAULT_MAX_RECONNECT_ATTEMPTS,
	} = config;

	const [isReady, setIsReady] = useState(false);
	const [messages, setMessages] = useState<MessagesCollection>({ others: [] });
	const [error, setError] = useState<WebSocketError | null>(null);

	const wsRef = useRef<WebSocket | null>(null);
	const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const reconnectAttemptsRef = useRef(0);
	const isConnectingRef = useRef(false);
	const isClosingRef = useRef(false);

	// Use refs for config values to avoid stale closures in callbacks
	const configRef = useRef({ maxReconnectAttempts, reconnectInterval, url, token });
	configRef.current = { maxReconnectAttempts, reconnectInterval, url, token };

	// Track error state in ref to avoid stale closures in onclose handler
	const errorRef = useRef<WebSocketError | null>(null);
	errorRef.current = error;

	const clearTimeouts = useCallback(() => {
		if (reconnectTimeoutRef.current) {
			clearTimeout(reconnectTimeoutRef.current);
			reconnectTimeoutRef.current = null;
		}
	}, []);

	const scheduleReconnect = useCallback(() => {
		const { maxReconnectAttempts: maxAttempts, reconnectInterval: interval } = configRef.current;

		if (reconnectAttemptsRef.current >= maxAttempts) {
			logger.error(LogCategory.WebSocket, 'Max reconnect attempts reached');
			setError({ type: 'max_reconnects', message: 'Max reconnect attempts reached. Please refresh the page.' });
			return;
		}

		const delay = interval * 1.5 ** reconnectAttemptsRef.current;
		logger.debug(
			LogCategory.WebSocket,
			`Scheduling reconnect attempt ${reconnectAttemptsRef.current + 1} in ${delay}ms`,
		);

		reconnectTimeoutRef.current = setTimeout(() => {
			reconnectAttemptsRef.current += 1;
			isConnectingRef.current = false;
			// The effect will trigger reconnection when isConnectingRef is false
			setIsReady(false);
		}, delay);
	}, []);

	const connect = useCallback(() => {
		const { maxReconnectAttempts: maxAttempts, url: wsUrl, token: wsToken } = configRef.current;

		// Prevent duplicate connections
		if (isConnectingRef.current || wsRef.current?.readyState === WebSocket.OPEN) {
			return;
		}

		if (!wsToken) {
			setError({ type: 'auth', message: 'No token provided.' });
			return;
		}

		if (reconnectAttemptsRef.current >= maxAttempts) {
			logger.error(LogCategory.WebSocket, 'Max reconnect attempts reached');
			setError({ type: 'max_reconnects', message: 'Max reconnect attempts reached. Please refresh the page.' });
			return;
		}

		isConnectingRef.current = true;
		isClosingRef.current = false;
		logger.debug(LogCategory.WebSocket, `Connecting to: ${wsUrl}`);

		const ws = new WebSocket(wsUrl);

		ws.onopen = () => {
			logger.debug(LogCategory.WebSocket, 'Connection opened, sending auth');
			ws.send(JSON.stringify({ authorization: configRef.current.token }));
		};

		ws.onmessage = (event) => {
			let data: WebSocketMessage;

			try {
				data = JSON.parse(event.data) as WebSocketMessage;
			} catch (parseError) {
				logger.error(LogCategory.WebSocket, 'Failed to parse message', { error: parseError, rawData: event.data });
				setError({
					type: 'parse',
					message: 'Failed to parse WebSocket message',
					originalError: parseError,
				});
				return;
			}

			// Handle auth success - reset reconnect attempts
			if (data.type === 'auth_success') {
				logger.debug(LogCategory.WebSocket, 'Authentication successful');
				reconnectAttemptsRef.current = 0;
				isConnectingRef.current = false;
				setIsReady(true);
				setError(null);
				return;
			}

			// Handle auth error
			if (data.type === 'auth_error') {
				logger.error(LogCategory.WebSocket, 'Authentication failed');
				setError({ type: 'auth', message: 'WebSocket authentication failed' });
				handleSessionExpiry({ source: 'websocket_auth_error' });
				ws.close();
				return;
			}

			// Store regular messages
			setMessages((prevMessages) => {
				const pk = data.data?.pk?.toString();

				if (pk) {
					const pkMessages = [...(prevMessages[pk] ?? [])];
					pkMessages.unshift(data);
					return {
						...prevMessages,
						[pk]: pkMessages.slice(0, 10),
					};
				}

				const othersMessages = [...prevMessages.others];
				othersMessages.unshift(data);
				return {
					...prevMessages,
					others: othersMessages.slice(0, 10),
				};
			});
		};

		ws.onclose = (event) => {
			logger.debug(LogCategory.WebSocket, `Connection closed (code: ${event.code}, reason: ${event.reason || 'none'})`);
			isConnectingRef.current = false;
			setIsReady(false);

			// Don't reconnect if closed intentionally (code 1000) or due to auth failure
			if (event.code !== 1_000 && errorRef.current?.type !== 'auth') {
				scheduleReconnect();
			}
		};

		ws.onerror = (wsError) => {
			// During intentional cleanup (navigation, unmount), the browser fires an error event
			// with minimal info ({isTrusted: true}). This is normal behavior, not an actual error.
			if (isClosingRef.current) {
				logger.debug(LogCategory.WebSocket, 'Connection closed during cleanup');
				return;
			}

			// Detect browser-initiated cleanup errors that happen BEFORE React's cleanup runs.
			// During navigation, the browser may close WebSockets before useEffect cleanup fires.
			// These errors have only `isTrusted: true` with no actual error information.
			const isBrowserCleanupError =
				wsError instanceof Event &&
				wsError.isTrusted &&
				wsError.type === 'error' &&
				// WebSocket is already closing/closed when browser initiates cleanup
				(ws.readyState === WebSocket.CLOSING || ws.readyState === WebSocket.CLOSED);

			if (isBrowserCleanupError) {
				logger.debug(LogCategory.WebSocket, 'Connection closed by browser during navigation');
				return;
			}

			logger.error(LogCategory.WebSocket, 'Connection error', { error: wsError });
			setError({
				type: 'connection',
				message: 'WebSocket connection error',
				originalError: wsError,
			});
		};

		wsRef.current = ws;
	}, [scheduleReconnect]);

	useEffect(() => {
		if (url && token) {
			connect();
		}

		return () => {
			logger.debug(LogCategory.WebSocket, 'Cleanup: closing connection');
			clearTimeouts();

			// Mark as intentionally closing to suppress spurious error events
			isClosingRef.current = true;

			if (wsRef.current) {
				wsRef.current.close(1_000, 'Component unmounted');
				wsRef.current = null;
			}

			isConnectingRef.current = false;
		};
	}, [url, token, connect, clearTimeouts]);

	const send = (data: Record<string, unknown> | string) => {
		if (wsRef.current?.readyState === WebSocket.OPEN) {
			const payload = typeof data === 'string' ? data : JSON.stringify(data);
			wsRef.current.send(payload);
		} else {
			logger.warn(LogCategory.WebSocket, 'Cannot send message: connection not open');
		}
	};

	return {
		ready: isReady,
		reconnectAttempts: reconnectAttemptsRef.current,
		messages,
		error,
		send,
	};
}
