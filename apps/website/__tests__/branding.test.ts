import { describe, expect, it } from 'vitest';
import { DEFAULT_BRANDING, getSafeBrandingFileName, parseBranding } from '@/util/branding';

describe('parseBranding', () => {
	it('reads a complete configuration', () => {
		const branding = parseBranding({
			appName: 'DataTagger',
			institution: {
				name: 'Johannes Kepler University Linz',
				shortName: 'JKU',
				unit: 'University Library',
				url: 'https://www.jku.at',
			},
			logo: { light: 'logo.svg', dark: 'logo-dark.svg', alt: 'JKU' },
			icons: { favicon: 'favicon.ico', icon: 'favicon-32x32.png', app: ['icon-192x192.png', '../x.png'] },
			links: { contact: 'https://www.jku.at/kontakt/', imprint: 'https://www.jku.at/impressum/' },
			showTestEnvironmentBanner: false,
		});

		expect(branding.institution.name).toBe('Johannes Kepler University Linz');
		expect(branding.logo).toEqual({ alt: 'JKU', light: '/branding/logo.svg', dark: '/branding/logo-dark.svg' });
		expect(branding.links.contact).toBe('https://www.jku.at/kontakt/');
		expect(branding.icons).toEqual({
			app: ['/branding/icon-192x192.png'],
			appleTouchIcon: null,
			favicon: '/branding/favicon.ico',
			icon: '/branding/favicon-32x32.png',
		});
		expect(branding.showTestEnvironmentBanner).toBe(false);
	});

	it('falls back to defaults for missing or invalid values', () => {
		expect(parseBranding(null)).toEqual(DEFAULT_BRANDING);

		const branding = parseBranding({
			appName: '',
			logo: { light: 'logo.png' },
			links: { contact: 'ftp://example.org/contact', imprint: 'www.example.org' },
			showTestEnvironmentBanner: 'no',
		});

		expect(branding.appName).toBe('DataTagger');
		// Without a dark logo, the light one is used in both themes
		expect(branding.logo.dark).toBe('/branding/logo.png');
		expect(branding.links).toEqual({ contact: null, imprint: null });
		expect(branding.showTestEnvironmentBanner).toBe(true);
	});
});

describe('getSafeBrandingFileName', () => {
	it('only allows image files directly in the branding folder', () => {
		expect(getSafeBrandingFileName('logo.svg')).toBe('logo.svg');
		expect(getSafeBrandingFileName('Logo-Dark.PNG')).toBe('Logo-Dark.PNG');
		expect(getSafeBrandingFileName('../secrets.svg')).toBeNull();
		expect(getSafeBrandingFileName('branding.json')).toBeNull();
		expect(getSafeBrandingFileName('logo.svg/../x.png')).toBeNull();
		expect(getSafeBrandingFileName(undefined)).toBeNull();
	});
});
