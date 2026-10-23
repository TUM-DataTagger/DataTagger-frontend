import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { cache } from 'react';
import { logger, LogCategory } from '@/util/logger';

/**
 * Institution-specific look of the app (logo, names, links), configured in `branding/branding.json` instead of the
 * code. The folder can be changed with the BRANDING_DIR environment variable, e.g. to mount it into a container.
 */
export type Branding = {
	readonly appName: string;
	// Browser tab and home screen icons, as URLs served by the app (/branding/<file>)
	readonly icons: {
		readonly app: readonly string[];
		readonly appleTouchIcon: string | null;
		readonly favicon: string | null;
		readonly icon: string | null;
	};
	readonly institution: {
		readonly name: string;
		readonly shortName: string;
		readonly unit: string;
		readonly url: string | null;
	};
	readonly links: {
		readonly contact: string | null;
		readonly imprint: string | null;
	};
	readonly logo: {
		readonly alt: string;
		// URLs served by the app (/branding/<file>), or null to show no logo
		readonly dark: string | null;
		readonly light: string | null;
	};
	readonly showTestEnvironmentBanner: boolean;
};

export const DEFAULT_BRANDING: Branding = {
	appName: 'DataTagger',
	icons: { app: [], appleTouchIcon: null, favicon: null, icon: null },
	institution: { name: '', shortName: '', unit: '', url: null },
	links: { contact: null, imprint: null },
	logo: { alt: '', dark: null, light: null },
	showTestEnvironmentBanner: true,
};

export const BRANDING_FILE_EXTENSIONS: Readonly<Record<string, string>> = {
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.webp': 'image/webp',
	'.ico': 'image/x-icon',
};

export function getBrandingDir() {
	return path.resolve(process.env.BRANDING_DIR ?? path.join(process.cwd(), 'branding'));
}

/**
 * Only plain file names from the branding folder with an image extension, so the config can't point anywhere else.
 */
export function getSafeBrandingFileName(fileName: unknown): string | null {
	if (typeof fileName !== 'string' || !fileName) {
		return null;
	}

	const baseName = path.basename(fileName);
	if (baseName !== fileName || !(path.extname(baseName).toLowerCase() in BRANDING_FILE_EXTENSIONS)) {
		return null;
	}

	return baseName;
}

function getString(value: unknown, fallback: string) {
	return typeof value === 'string' ? value.trim() : fallback;
}

function getUrl(value: unknown) {
	return typeof value === 'string' && /^https?:\/\//.test(value.trim()) ? value.trim() : null;
}

function getLogoUrl(value: unknown) {
	const fileName = getSafeBrandingFileName(value);
	return fileName ? `/branding/${encodeURIComponent(fileName)}` : null;
}

export function parseBranding(raw: unknown): Branding {
	const config = (raw && typeof raw === 'object' ? raw : {}) as Record<string, Record<string, unknown> | unknown>;
	const institution = (config.institution ?? {}) as Record<string, unknown>;
	const links = (config.links ?? {}) as Record<string, unknown>;
	const logo = (config.logo ?? {}) as Record<string, unknown>;
	const icons = (config.icons ?? {}) as Record<string, unknown>;
	const lightLogo = getLogoUrl(logo.light);

	return {
		appName: getString(config.appName, DEFAULT_BRANDING.appName) || DEFAULT_BRANDING.appName,
		icons: {
			app: (Array.isArray(icons.app) ? icons.app : [icons.app]).flatMap((file) => getLogoUrl(file) ?? []),
			appleTouchIcon: getLogoUrl(icons.appleTouchIcon),
			favicon: getLogoUrl(icons.favicon),
			icon: getLogoUrl(icons.icon),
		},
		institution: {
			name: getString(institution.name, ''),
			shortName: getString(institution.shortName, ''),
			unit: getString(institution.unit, ''),
			url: getUrl(institution.url),
		},
		links: {
			contact: getUrl(links.contact),
			imprint: getUrl(links.imprint),
		},
		logo: {
			alt: getString(logo.alt, getString(institution.shortName, '')),
			light: lightLogo,
			// Without a separate dark logo, the light one is used in both themes
			dark: getLogoUrl(logo.dark) ?? lightLogo,
		},
		showTestEnvironmentBanner:
			typeof config.showTestEnvironmentBanner === 'boolean'
				? config.showTestEnvironmentBanner
				: DEFAULT_BRANDING.showTestEnvironmentBanner,
	};
}

/**
 * Read on every request (cached per request), so changes to the file show up after a page reload without a rebuild.
 */
export const getBranding = cache(async (): Promise<Branding> => {
	const file = path.join(getBrandingDir(), 'branding.json');

	try {
		return parseBranding(JSON.parse(await readFile(file, 'utf8')));
	} catch (error) {
		logger.warn(LogCategory.Error, 'Could not read branding configuration, using defaults', {
			file,
			error: error instanceof Error ? error.message : String(error),
		});
		return DEFAULT_BRANDING;
	}
});
