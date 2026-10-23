import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { BRANDING_FILE_EXTENSIONS, getBrandingDir, getSafeBrandingFileName } from '@/util/branding';

/**
 * Serves the logo files of the branding folder, so they can be replaced without rebuilding the app.
 */
export async function GET(_request: Request, { params }: { readonly params: Promise<{ readonly file: string }> }) {
	const { file } = await params;
	const fileName = getSafeBrandingFileName(decodeURIComponent(file));

	if (!fileName) {
		return new NextResponse(null, { status: 404 });
	}

	try {
		const content = await readFile(path.join(getBrandingDir(), fileName));

		return new NextResponse(content, {
			headers: {
				'Content-Type': BRANDING_FILE_EXTENSIONS[path.extname(fileName).toLowerCase()] ?? 'application/octet-stream',
				// Short cache, so a replaced logo shows up quickly
				'Cache-Control': 'public, max-age=60',
				// SVG files must not run scripts
				'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
				'X-Content-Type-Options': 'nosniff',
			},
		});
	} catch {
		return new NextResponse(null, { status: 404 });
	}
}
