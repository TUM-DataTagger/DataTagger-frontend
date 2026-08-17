export type FirstTimeFlagKind = 'project' | 'folder' | 'metadata-template';

export type FirstTimeFlagKeyConfig = {
	readonly canonicalKey: string;
	readonly legacyKeys: readonly string[];
};

export const FIRST_TIME_FLAG_KEYS = {
	project: {
		canonicalKey: 'onboarding:is-first-time-project',
		legacyKeys: ['isFirstTimeProject'],
	},
	folder: {
		canonicalKey: 'onboarding:is-first-time-folder',
		legacyKeys: ['isFirstTimeFolder'],
	},
	'metadata-template': {
		canonicalKey: 'onboarding:is-first-time-metadata-template',
		legacyKeys: ['isFirstTimeMetadataTemplate'],
	},
} as const satisfies Record<FirstTimeFlagKind, FirstTimeFlagKeyConfig>;
