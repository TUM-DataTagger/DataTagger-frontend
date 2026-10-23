'use client';

import { useBranding } from '@/contexts/BrandingContext';
import { cx } from '@/styles/cva';

/**
 * The institution logo from the branding configuration (branding/branding.json). Light and dark versions are switched
 * with CSS, so the server and the browser render the same markup.
 */
export function BrandLogo(props: { readonly className?: string; readonly size: 'large' | 'small' }) {
	const { logo } = useBranding();

	if (!logo.light) {
		return null;
	}

	const heightClassName = props.size === 'large' ? 'h-[30px]' : 'h-4';

	return (
		<>
			{/* eslint-disable-next-line nextjs/no-img-element -- logos are replaceable files served from the branding folder */}
			<img
				alt={logo.alt}
				className={cx(
					heightClassName,
					'w-auto max-w-40',
					logo.dark === logo.light ? null : 'dark:hidden',
					props.className,
				)}
				src={logo.light}
			/>
			{logo.dark && logo.dark !== logo.light ? (
				// eslint-disable-next-line nextjs/no-img-element -- see above
				<img
					alt={logo.alt}
					className={cx(heightClassName, 'hidden w-auto max-w-40 dark:block', props.className)}
					src={logo.dark}
				/>
			) : null}
		</>
	);
}
