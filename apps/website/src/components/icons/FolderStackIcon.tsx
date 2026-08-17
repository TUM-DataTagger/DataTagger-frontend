import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';
import type { SVGProps } from 'react';
import { FolderStack, FolderStackDark } from './FolderStack';

export const FolderStackIcon = (props: SVGProps<SVGSVGElement>) => {
	const { resolvedTheme } = useTheme();

	return resolvedTheme === 'light' ? <FolderStack {...props} /> : <FolderStackDark {...props} />;
};

export const FolderStackIconNoSSR = dynamic(async () => FolderStackIcon, { ssr: false });
