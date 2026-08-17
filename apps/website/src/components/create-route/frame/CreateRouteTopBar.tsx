import type { ReactNode } from 'react';

type CreateRouteTopBarProps = {
	readonly closeButton: ReactNode;
	readonly title: ReactNode | string;
};

export function CreateRouteTopBar({ closeButton, title }: CreateRouteTopBarProps) {
	return (
		<div className="sticky top-0 z-20 flex h-16 place-content-between place-items-center bg-base-neutral-800 px-4 pt-6 pb-4 text-base-xl text-base-neutral-40 md:px-[132px] dark:bg-base-neutral-100 dark:text-base-neutral-900">
			<span>{title}</span>
			{closeButton}
		</div>
	);
}
