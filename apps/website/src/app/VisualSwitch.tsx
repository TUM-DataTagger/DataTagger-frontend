'use client';

import { Laptop2Icon, MoonIcon, SmartphoneIcon, SunIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { Radio, RadioGroup } from '@/components/ui/RadioGroup';
import { cx } from '@/styles/cva';

export function VisualSwitch(props: { readonly className?: string }) {
	const { theme, setTheme } = useTheme();

	return (
		<RadioGroup
			aria-label="Visual switch"
			className={cx(
				'border-base-neutral-300 dark:border-base-neutral-500 rounded-[20px] border p-[6px]',
				props.className,
			)}
			classNames={{
				content: 'group-orientation-horizontal:gap-2 group-orientation-horizontal:flex-nowrap',
			}}
			onChange={async (newTheme) => setTheme(newTheme)}
			orientation="horizontal"
			value={theme ?? 'system'}
		>
			<Radio
				aria-label="Light mode"
				className="hover:bg-base-neutral-80 focus-visible:bg-base-neutral-80 focus-visible:outline-base-lavender-400 pressed:bg-base-neutral-200 selected:bg-base-neutral-100 dark:outline-base-lavender-600 dark:hover:bg-base-neutral-700 dark:pressed:bg-base-neutral-600 dark:selected:bg-base-neutral-700 rounded-full p-[5px] outline-0 outline-offset-2 focus-visible:outline-2 forced-colors:outline-[Highlight]"
				showIndicator={false}
				value="light"
			>
				<SunIcon aria-hidden size={18} strokeWidth={1.5} />
			</Radio>
			<Radio
				aria-label="Dark mode"
				className="hover:bg-base-neutral-80 focus-visible:bg-base-neutral-80 focus-visible:outline-base-lavender-400 pressed:bg-base-neutral-200 selected:bg-base-neutral-100 dark:outline-base-lavender-600 dark:hover:bg-base-neutral-700 dark:pressed:bg-base-neutral-600 dark:selected:bg-base-neutral-700 rounded-full p-[5px] outline-0 outline-offset-2 focus-visible:outline-2 forced-colors:outline-[Highlight]"
				showIndicator={false}
				value="dark"
			>
				<MoonIcon aria-hidden size={18} strokeWidth={1.5} />
			</Radio>
			<Radio
				aria-label="System mode"
				className="hover:bg-base-neutral-80 focus-visible:bg-base-neutral-80 focus-visible:outline-base-lavender-400 pressed:bg-base-neutral-200 selected:bg-base-neutral-100 dark:outline-base-lavender-600 dark:hover:bg-base-neutral-700 dark:pressed:bg-base-neutral-600 dark:selected:bg-base-neutral-700 rounded-full p-[5px] outline-0 outline-offset-2 focus-visible:outline-2 forced-colors:outline-[Highlight]"
				showIndicator={false}
				value="system"
			>
				<Laptop2Icon aria-hidden className="hidden md:block" size={18} strokeWidth={1.5} />
				<SmartphoneIcon aria-hidden className="md:hidden" size={18} strokeWidth={1.5} />
			</Radio>
		</RadioGroup>
	);
}

export const VisualSwitchNoSSR = dynamic(async () => VisualSwitch, { ssr: false });
