'use client';

import { useQuery } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { createContext, use, useMemo } from 'react';
import type { MessagesCollection } from '@/hooks/useWebSocketConnection';
import { useWebSocketConnectionInternal } from '@/hooks/useWebSocketConnection';
import { $api, openAPIClient } from '@/util/clientFetch';
import { useEnv } from './EnvContext';

type WebSocketConnectionReturn = ReturnType<typeof useWebSocketConnectionInternal>;

/**
 * Stable context for connection state (ready, error, send).
 * This value changes infrequently and is safe for most consumers.
 */
type WebSocketStableContextType = {
	readonly error: WebSocketConnectionReturn['error'];
	readonly ready: boolean;
	readonly send: WebSocketConnectionReturn['send'];
};

/**
 * Separate context for messages that changes on every WebSocket message.
 * Only components that need real-time messages should use this.
 */
type WebSocketMessagesContextType = {
	readonly messages: MessagesCollection;
};

const WebSocketStableContext = createContext<WebSocketStableContextType | undefined>(undefined);
const WebSocketMessagesContext = createContext<WebSocketMessagesContextType | undefined>(undefined);

/**
 * Hook for WebSocket connection state (ready, error, send).
 * Use this for components that need connection status or to send messages.
 * This hook does NOT cause re-renders when messages are received.
 */
export function useWebSocketConnection() {
	const context = use(WebSocketStableContext);
	if (!context) {
		throw new Error('useWebSocketConnection must be used within a WebSocketProvider');
	}

	return context;
}

/**
 * Hook for WebSocket messages.
 * Use this only when you need real-time message updates.
 * WARNING: This will cause re-renders on every WebSocket message received.
 */
export function useWebSocketMessages() {
	const context = use(WebSocketMessagesContext);
	if (!context) {
		throw new Error('useWebSocketMessages must be used within a WebSocketProvider');
	}

	return context.messages;
}

/**
 * Combined hook for components that need both connection state AND messages.
 * Prefer using useWebSocketConnection() when you don't need messages,
 * or useWebSocketMessages() when you only need messages.
 */
export function useWebSocket() {
	const stable = use(WebSocketStableContext);
	const messagesCtx = use(WebSocketMessagesContext);

	if (!stable || !messagesCtx) {
		throw new Error('useWebSocket must be used within a WebSocketProvider');
	}

	return {
		ready: stable.ready,
		error: stable.error,
		send: stable.send,
		messages: messagesCtx.messages,
	};
}

export function WebSocketProvider({ children }: PropsWithChildren) {
	const env = useEnv();

	const { data: authJwtCookieData } = useQuery({
		queryKey: $api.queryOptions('post', '/api/v1/authjwtcookie/').queryKey,
		queryFn: async () => {
			const { data } = await openAPIClient.POST('/api/v1/authjwtcookie/');

			return data ?? null;
		},
	});

	const { ready, messages, error, send } = useWebSocketConnectionInternal({
		url: env.BASE_WS_URL,
		token: authJwtCookieData?.token,
	});

	// Stable context value - only changes when connection state changes
	const stableValue = useMemo<WebSocketStableContextType>(() => ({ ready, error, send }), [ready, error, send]);

	// Messages context value - changes on every message
	const messagesValue = useMemo<WebSocketMessagesContextType>(() => ({ messages }), [messages]);

	return (
		<WebSocketStableContext.Provider value={stableValue}>
			<WebSocketMessagesContext.Provider value={messagesValue}>{children}</WebSocketMessagesContext.Provider>
		</WebSocketStableContext.Provider>
	);
}
