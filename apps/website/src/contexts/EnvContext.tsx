'use client';

import type { PropsWithChildren } from 'react';
import { createContext, use, useMemo } from 'react';
import type { ENV } from '@/util/env';

type EnvContextType = typeof ENV;

const EnvContext = createContext<EnvContextType | undefined>(undefined);

export function useEnv() {
	const context = use(EnvContext);
	if (!context) {
		throw new Error('useEnv must be used within an EnvProvider.');
	}

	return context;
}

type EnvProviderProps = PropsWithChildren & {
	readonly env: EnvContextType;
};

export function EnvProvider({ children, env }: EnvProviderProps) {
	const contextValue = useMemo(() => env, [env]);

	return <EnvContext.Provider value={contextValue}>{children}</EnvContext.Provider>;
}
