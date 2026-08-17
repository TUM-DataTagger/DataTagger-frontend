'use client';

import { Laptop2Icon, MoonIcon, SmartphoneIcon, SunIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';
import { Radio, RadioGroup } from '@/components/ui/RadioGroup';
import { cx } from '@/styles/cva';

export function VisualSwitch(props: { readonly className?: string; onThemeChange?(theme: string): void }) {
	const { theme, setTheme } = useTheme();

	return (
		<RadioGroup
			aria-label="Visual switch"
			className={cx(
				'flex rounded-[20px] border border-base-neutral-300 p-1.5 dark:border-base-neutral-500 orientation-horizontal:space-x-1.5',
				props.className,
			)}
			onChange={(newTheme) => {
				setTheme(newTheme);
				props.onThemeChange?.(newTheme);
			}}
			orientation="horizontal"
			value={theme ?? 'system'}
		>
			<Radio
				aria-label="Light mode"
				className="rounded-full p-[5px] outline-0 outline-offset-2 hover:bg-base-neutral-80 focus-visible:bg-base-neutral-80 focus-visible:outline-2 focus-visible:outline-base-lavender-400 dark:outline-base-lavender-600 dark:hover:bg-base-neutral-700 forced-colors:outline-[Highlight] pressed:bg-base-neutral-200 dark:pressed:bg-base-neutral-600 selected:bg-base-neutral-100 dark:selected:bg-base-neutral-700"
				showIndicator={false}
				value="light"
			>
				<SunIcon aria-hidden size={18} strokeWidth={1.5} />
			</Radio>
			<Radio
				aria-label="Dark mode"
				className="rounded-full p-[5px] outline-0 outline-offset-2 hover:bg-base-neutral-80 focus-visible:bg-base-neutral-80 focus-visible:outline-2 focus-visible:outline-base-lavender-400 dark:outline-base-lavender-600 dark:hover:bg-base-neutral-700 forced-colors:outline-[Highlight] pressed:bg-base-neutral-200 dark:pressed:bg-base-neutral-600 selected:bg-base-neutral-100 dark:selected:bg-base-neutral-700"
				showIndicator={false}
				value="dark"
			>
				<MoonIcon aria-hidden size={18} strokeWidth={1.5} />
			</Radio>
			<Radio
				aria-label="System mode"
				className="rounded-full p-[5px] outline-0 outline-offset-2 hover:bg-base-neutral-80 focus-visible:bg-base-neutral-80 focus-visible:outline-2 focus-visible:outline-base-lavender-400 dark:outline-base-lavender-600 dark:hover:bg-base-neutral-700 forced-colors:outline-[Highlight] pressed:bg-base-neutral-200 dark:pressed:bg-base-neutral-600 selected:bg-base-neutral-100 dark:selected:bg-base-neutral-700"
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
