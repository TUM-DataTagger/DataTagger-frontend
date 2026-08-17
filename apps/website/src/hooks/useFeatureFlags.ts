'use client';

import { useQuery } from '@tanstack/react-query';

export type FeatureFlagValue = boolean | number | string;
export type FeatureFlagDefinition = {
	readonly defaultValue?: FeatureFlagValue;
	readonly description?: string;
};
export type FeatureFlagsData = {
	readonly definitions: Record<string, FeatureFlagDefinition>;
	readonly values: Record<string, FeatureFlagValue>;
};

export function getFeatureFlagValue(
	flagsData: FeatureFlagsData | undefined,
	key: string,
): FeatureFlagValue | undefined {
	const definition = flagsData?.definitions[key];
	return flagsData?.values[key] ?? definition?.defaultValue;
}

export function isFeatureFlagEnabled(flagsData: FeatureFlagsData | undefined, key: string): boolean {
	const value = getFeatureFlagValue(flagsData, key);
	return value === true || value === 1 || value === '1';
}

export function useFeatureFlags() {
	return useQuery<FeatureFlagsData>({
		queryKey: ['flags'],
		queryFn: async () => {
			const response = await fetch('/flags');

			if (!response.ok) {
				throw new Error(`Failed to fetch flags (${response.status})`);
			}

			return (await response.json()) as FeatureFlagsData;
		},
	});
}
