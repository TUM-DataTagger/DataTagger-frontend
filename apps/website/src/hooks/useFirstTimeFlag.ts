'use client';

import { useCallback } from 'react';
import { useLocalStorageBoolean } from '@/hooks/useLocalStorageBoolean';
import { FIRST_TIME_FLAG_KEYS, type FirstTimeFlagKind } from '@/util/firstTimeFlags';

export function useFirstTimeFlag(kind: FirstTimeFlagKind) {
	const keyConfig = FIRST_TIME_FLAG_KEYS[kind];
	const { value, setValue } = useLocalStorageBoolean({
		canonicalKey: keyConfig.canonicalKey,
		legacyKeys: keyConfig.legacyKeys,
	});

	const markCompleted = useCallback(() => {
		setValue(false);
	}, [setValue]);

	const reset = useCallback(() => {
		setValue(true);
	}, [setValue]);

	return {
		isFirstTime: value ?? true,
		markCompleted,
		reset,
	};
}
