import createMDX from '@next/mdx';
import type { NextConfig } from 'next';
import { versionInfo } from './src/util/version-info';

const withMDX = createMDX({});

export default withMDX({
	reactStrictMode: true,
	output: 'standalone',
	pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
	images: {
		dangerouslyAllowSVG: true,
		contentDispositionType: 'attachment',
		contentSecurityPolicy: "default-src 'self'; frame-src 'none'; sandbox;",
		remotePatterns: [
			{
				protocol: 'http',
				hostname: 'localhost',
			},
		],
	},
	poweredByHeader: false,
	logging: {
		fetches: {
			fullUrl: true,
		},
	},
	experimental: {
		ppr: true,
		reactCompiler: true,
		mdxRs: true,
	},
	eslint: {
		ignoreDuringBuilds: true,
	},
	typescript: {
		ignoreBuildErrors: true,
	},
	generateBuildId: () => versionInfo.hash,
} satisfies NextConfig);
