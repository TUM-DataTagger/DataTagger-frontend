import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';
import type { SVGProps } from 'react';
import { ProjectStack, ProjectStackDark } from './ProjectStack';

export const ProjectStackIcon = (props: SVGProps<SVGSVGElement>) => {
	const { resolvedTheme } = useTheme();

	return resolvedTheme === 'light' ? <ProjectStack {...props} /> : <ProjectStackDark {...props} />;
};

export const ProjectStackIconNoSSR = dynamic(async () => ProjectStackIcon, { ssr: false });
