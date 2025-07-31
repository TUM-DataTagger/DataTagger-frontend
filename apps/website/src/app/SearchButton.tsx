'use client';

import type { VariantProps } from 'cva';
import { useSetAtom } from 'jotai';
import { SearchIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { isCmdKOpenAtom } from '@/stores/cmdk';
import { cx } from '@/styles/cva';
import type { buttonStyles } from '@/styles/ui/button';

export function SearchButton({
	variant = 'secondary-filled',
	onClick = () => {},
	...props
}: VariantProps<typeof buttonStyles> & {
	readonly className?: string | undefined;
	onClick?(): void;
}) {
	const setIsCmdKOpen = useSetAtom(isCmdKOpenAtom);
	const [isMac, setIsMac] = useState(false);

	useEffect(() => {
		setIsMac(navigator.platform.startsWith('Mac') || navigator.platform === 'iPhone');
	}, []);

	return (
		<Button
			className={cx(
				'md:border-base-neutral-300 md:bg-base-neutral-0 md:hover:bg-base-neutral-700 md:focus-visible:bg-base-neutral-700 md:pressed:border-transparent md:pressed:bg-base-neutral-800 dark:md:bg-base-neutral-800 dark:md:hover:bg-base-neutral-100 dark:border-base-neutral-500 dark:md:focus-visible:bg-base-neutral-100 dark:md:pressed:bg-base-neutral-60 group h-10 w-10 rounded-full p-[10px] md:w-auto md:rounded-sm md:border md:py-2 md:pr-2 md:pl-3 md:transition-none md:hover:border-transparent md:focus-visible:border-transparent',
				props.className,
			)}
			onPress={() => {
				onClick?.();
				setIsCmdKOpen(true);
			}}
			variant={variant}
		>
			<span className="flex place-items-center gap-6">
				<span className="flex place-items-center gap-3">
					<SearchIcon
						aria-hidden
						className="md:group-hover:text-base-neutral-40 md:group-focus-visible:text-base-neutral-40 md:group-pressed:text-base-neutral-40 dark:group-hover:text-base-neutral-900 dark:group-focus-visible:text-base-neutral-900 dark:group-pressed:text-base-neutral-900 dark:md:text-base-neutral-40"
						size={18}
						strokeWidth={1.5}
					/>
					<span className="text-base-md text-base-neutral-500 group-hover:text-base-neutral-300 group-focus-visible:text-base-neutral-300 group-pressed:text-base-neutral-300 dark:text-base-neutral-300 dark:group-hover:text-base-neutral-500 dark:group-focus-visible:text-base-neutral-500 dark:group-pressed:text-base-neutral-500 hidden md:block">
						Search for ...
					</span>
				</span>
				<span className="hidden place-items-center gap-1 md:flex">
					<span className="bg-base-neutral-100 text-base-sm dark:bg-base-neutral-700 dark:text-base-neutral-100 rounded-sm px-2 py-1">
						{isMac ? '⌘' : 'Ctrl'}
					</span>
					<span className="bg-base-neutral-100 text-base-sm dark:bg-base-neutral-700 dark:text-base-neutral-100 rounded-sm px-2 py-1">
						K
					</span>
				</span>
			</span>
		</Button>
	);
}

export const SearchButtonNoSSR = dynamic(async () => SearchButton, { ssr: false });
