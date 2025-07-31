import type { PropsWithChildren } from 'react';
import { CloseButton } from './CloseButton';

export default async function Layout({ children }: PropsWithChildren) {
	return (
		<>
			<div className="bg-base-neutral-800 text-base-xl text-base-neutral-40 dark:bg-base-neutral-100 dark:text-base-neutral-900 sticky top-0 z-10 flex h-16 place-content-between place-items-center px-4 pt-6 pb-4 md:px-[132px]">
				<span>Create metadata template</span>
				<CloseButton />
			</div>
			{children}
		</>
	);
}
