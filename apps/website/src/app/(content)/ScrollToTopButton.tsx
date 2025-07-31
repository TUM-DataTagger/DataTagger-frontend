'use client';

import { CircleArrowUpIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cx } from '@/styles/cva';

export function ScrollToTopButton(props: { readonly className?: string }) {
	const scrollToTop = () => {
		window.scrollTo({
			top: 0,
			behavior: 'smooth',
		});
	};

	return (
		<Button
			aria-label="Scroll to top"
			className={cx(
				'bg-base-lavender-800 text-base-neutral-40 hover:bg-base-lavender-600 hover:text-base-neutral-40 focus-visible:bg-base-lavender-600 focus-visible:text-base-neutral-40 pressed:bg-base-lavender-500 pressed:text-base-neutral-900 dark:bg-base-lavender-200 dark:text-base-neutral-900 dark:hover:bg-base-lavender-400 dark:hover:text-base-neutral-900 dark:focus-visible:bg-base-lavender-400 dark:focus-visible:text-base-neutral-900 dark:pressed:bg-base-lavender-500 dark:pressed:text-base-neutral-900 shadow-base-lg h-[56px] w-[56px] rounded-full p-4',
				props.className,
			)}
			onPress={scrollToTop}
			variant="unset"
		>
			<CircleArrowUpIcon aria-hidden size={24} strokeWidth={1.5} />
		</Button>
	);
}
