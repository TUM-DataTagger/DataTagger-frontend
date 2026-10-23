'use client';

import { parseAsString, useQueryState } from 'nuqs';

export function useCurrentSubfolder() {
	return useQueryState('subfolder', parseAsString);
}
