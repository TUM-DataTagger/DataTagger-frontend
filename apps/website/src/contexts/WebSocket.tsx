'use client';

import { useQuery } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { createContext, use, useMemo } from 'react';
import { useWebSocketConnection } from '@/hooks/useWebSocketConnection';
import { $api, openAPIClient } from '@/util/clientFetch';
import { useEnv } from './EnvContext';

type WebSocketContextType = Omit<ReturnType<typeof useWebSocketConnection>, 'reconnectAttempts'> & {
	send: ((data: ArrayBufferLike | ArrayBufferView | Blob | string) => void) | undefined;
};

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function useWebSocket() {
	const context = use(WebSocketContext);
	if (!context) {
		throw new Error('useWebSocket must be used within a WebSocketProvider');
	}

	return context;
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

	const { ready, messages, error, send } = useWebSocketConnection({
		url: env.BASE_WS_URL,
		token: authJwtCookieData?.token,
	});

	const value = useMemo(() => ({ ready, messages, error, send }), [ready, messages, error, send]);

	return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
}
