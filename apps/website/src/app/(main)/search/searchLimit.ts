import { GLOBAL_SEARCH_LIMIT } from '@/util/globalSearch';

export const SEARCH_LIMIT_OPTIONS = [GLOBAL_SEARCH_LIMIT, 50, 100] as const;

export type SearchLimit = (typeof SEARCH_LIMIT_OPTIONS)[number];

export function normalizeSearchLimit(value: number | string | null | undefined): SearchLimit {
	const parsedValue = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;

	return SEARCH_LIMIT_OPTIONS.find((option) => option === parsedValue) ?? GLOBAL_SEARCH_LIMIT;
}
