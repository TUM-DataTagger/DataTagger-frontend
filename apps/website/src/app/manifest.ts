import type { MetadataRoute } from 'next';
import { getBranding } from '@/util/branding';

// Web app manifest (home screen name and icons) from the branding configuration
export default async function manifest(): Promise<MetadataRoute.Manifest> {
	const { appName, icons } = await getBranding();

	return {
		name: appName,
		short_name: appName,
		icons: icons.app.map((src) => {
			const size = /\d+x\d+/.exec(src)?.[0];
			return size ? { src, sizes: size } : { src };
		}),
		theme_color: '#ffffff',
		background_color: '#ffffff',
		display: 'standalone',
	};
}
