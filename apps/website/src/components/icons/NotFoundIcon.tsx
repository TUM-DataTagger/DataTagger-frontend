'use client';

import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import type { SVGProps } from 'react';
import { useHover } from 'react-aria';
import { NotFound, NotFoundDark, NotFoundDarkHover, NotFoundHover } from './NotFound';

export const NotFoundIcon = (props: SVGProps<SVGSVGElement>) => {
	const { hoverProps, isHovered } = useHover({});
	const { resolvedTheme } = useTheme();

	return (
		<div {...hoverProps} aria-hidden>
			{resolvedTheme === 'light' ? (
				isHovered ? (
					<NotFoundHover aria-hidden {...props} />
				) : (
					<NotFound aria-hidden {...props} />
				)
			) : isHovered ? (
				<NotFoundDarkHover aria-hidden {...props} />
			) : (
				<NotFoundDark aria-hidden {...props} />
			)}
		</div>
	);
};

export const NotFoundIconNoSSR = dynamic(async () => NotFoundIcon, { ssr: false });
