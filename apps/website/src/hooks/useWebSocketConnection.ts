import { useState, useRef, useEffect, useCallback } from 'react';

type WebSocketConfig = {
	readonly maxReconnectAttempts?: number;
	readonly reconnectInterval?: number;
	readonly token?: string | undefined;
	readonly url: string;
};

type ConnectionState = {
	readonly ready: boolean;
	readonly reconnectAttempts: number;
};

type MessagesCollection = {
	[pk: string]: any[];
	others: any[];
};

export function useWebSocketConnection(config: WebSocketConfig) {
	const { url, token, reconnectInterval = 3_000, maxReconnectAttempts = 10 } = config;

	const [connectionState, setConnectionState] = useState<ConnectionState>({
		ready: false,
		reconnectAttempts: 0,
	});
	const [messages, setMessages] = useState<MessagesCollection>({ others: [] });
	const [error, setError] = useState<any>(null);

	const wsRef = useRef<WebSocket | null>(null);
	const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

	const clearTimeouts = useCallback(() => {
		if (reconnectTimeout.current) {
			clearTimeout(reconnectTimeout.current);
			reconnectTimeout.current = null;
		}
	}, []);

	const connect = useCallback(
		(url: string) => {
			if (!token) {
				setError('No token provided.');
				return;
			}

			if (connectionState.reconnectAttempts >= maxReconnectAttempts) {
				console.error('Max reconnect attempts reached.');
				setError('Max reconnect attempts reached.');
				return;
			}

			console.log('Connecting to WebSocket:', url);

			const ws = new WebSocket(url);

			ws.onopen = () => {
				console.log('WebSocket connected');
				if (token) {
					ws.send(JSON.stringify({ authorization: token }));
				}
			};

			ws.onmessage = (event) => {
				const data = JSON.parse(event.data);

				setMessages((prevMessages) => {
					const newMessages = { ...prevMessages };

					if (data.data.pk) {
						const pk = data.data.pk.toString();
						const pkMessages = [...(newMessages[pk] ?? [])];
						pkMessages.unshift(data);

						newMessages[pk] = pkMessages.slice(0, 10);
					} else {
						const othersMessages = [...newMessages.others];
						othersMessages.unshift(data);

						newMessages.others = othersMessages.slice(0, 10);
					}

					return newMessages;
				});

				if (data.type === 'auth_success') {
					setConnectionState({ ready: true, reconnectAttempts: 0 });
					setError(null);
				}
			};

			ws.onclose = () => {
				console.log('WebSocket disconnected');
				clearTimeouts();
				setConnectionState((prev) => ({ ...prev, ready: false }));

				// Reconnect
				// reconnectTimeout.current = setTimeout(() => {
				// 	setConnectionState(prev => ({ ...prev, reconnectAttempts: prev.reconnectAttempts + 1 }));
				// 	connect();
				// }, reconnectInterval);
			};

			ws.onerror = (error) => {
				console.error('WebSocket error:', error);
				setError(error);
			};

			wsRef.current = ws;
		},
		[url, token, reconnectInterval, maxReconnectAttempts, clearTimeouts, connectionState.reconnectAttempts],
	);

	useEffect(() => {
		if (!url) {
			return;
		}

		connect(url);

		return () => {
			console.log('WebSocket cleanup');
			clearTimeouts();
			wsRef.current?.close();
			wsRef.current = null;
		};
	}, [url, connect, clearTimeouts]);

	const send = useCallback((data: any) => {
		if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
			wsRef.current.send(data);
		} else {
			console.error('WebSocket not connected');
		}
	}, []);

	return {
		...connectionState,
		messages,
		error,
		send,
	};
}
