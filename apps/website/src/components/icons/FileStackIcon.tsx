import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';
import type { SVGProps } from 'react';
import { FileStack, FileStackDark } from './FileStack';

export const FileStackIcon = (props: SVGProps<SVGSVGElement>) => {
	const { resolvedTheme } = useTheme();

	return resolvedTheme === 'light' ? <FileStack {...props} /> : <FileStackDark {...props} />;
};

export const FileStackIconNoSSR = dynamic(async () => FileStackIcon, { ssr: false });
