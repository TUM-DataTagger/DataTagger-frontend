'use client';

import { CircleArrowUpIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cx } from '@/styles/cva';

function scrollToTop() {
	window.scrollTo({
		top: 0,
		behavior: 'smooth',
	});
}

export function ScrollToTopButton(props: { readonly className?: string }) {
	return (
		<Button
			aria-label="Scroll to top"
			className={cx(
				'h-14 w-14 rounded-full bg-base-lavender-800 p-4 text-base-neutral-40 shadow-base-lg hover:bg-base-lavender-600 hover:text-base-neutral-40 focus-visible:bg-base-lavender-600 focus-visible:text-base-neutral-40 dark:bg-base-lavender-200 dark:text-base-neutral-900 dark:hover:bg-base-lavender-400 dark:hover:text-base-neutral-900 dark:focus-visible:bg-base-lavender-400 dark:focus-visible:text-base-neutral-900 pressed:bg-base-lavender-500 pressed:text-base-neutral-900 dark:pressed:bg-base-lavender-500 dark:pressed:text-base-neutral-900',
				props.className,
			)}
			onPress={scrollToTop}
			variant="unset"
		>
			<CircleArrowUpIcon aria-hidden size={24} strokeWidth={1.5} />
		</Button>
	);
}
