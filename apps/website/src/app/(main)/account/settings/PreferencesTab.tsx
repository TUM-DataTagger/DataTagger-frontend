'use client';

import { LayoutGridIcon, ListIcon, Settings2Icon } from 'lucide-react';
import type { ReactNode } from 'react';
import { VisualSwitch } from '@/app/VisualSwitch';
import { Select, SelectContent, SelectItem, SelectLabel, SelectTrigger } from '@/components/ui/Select';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useUserSettingsMutation } from '@/hooks/useUserSettingsMutation';
import { VIEW_MODE_OPTIONS, type ViewModeOverride } from '@/util/userSettingsOptions';

export function LayoutThemeIcon({ value }: { readonly value: ViewModeOverride }) {
	const Icon = value === 'grid' ? LayoutGridIcon : value === 'table' ? ListIcon : Settings2Icon;

	return (
		<span
			className="inline-flex size-[18px] shrink-0 place-content-center place-items-center align-middle"
			data-slot="layout-icon"
		>
			<Icon aria-hidden className="size-[18px]! translate-y-px" data-slot="icon" strokeWidth={1.5} />
		</span>
	);
}

export function SettingsPanelHeader({
	children,
	description,
	descriptionIcon,
	icon,
}: {
	readonly children: string;
	readonly description?: string;
	readonly descriptionIcon?: ReactNode;
	readonly icon?: ReactNode;
}) {
	return (
		<header className="flex flex-col gap-1">
			<h1 className="flex place-items-center gap-2 text-base-heading-xs">
				{icon}
				{children}
			</h1>
			{description ? (
				<p className="flex place-items-center gap-1 text-base-md text-base-neutral-600 dark:text-base-neutral-300">
					{description}
					{descriptionIcon}
				</p>
			) : null}
		</header>
	);
}

export function SettingsRow({
	children,
	description,
	label,
}: {
	readonly children: ReactNode;
	readonly description: string;
	readonly label: string;
}) {
	return (
		<div className="flex min-h-14 w-full place-items-center gap-6 rounded-lg border border-base-neutral-100 bg-base-neutral-40 p-4 dark:border-base-neutral-700 dark:bg-base-neutral-800">
			<div className="min-w-0 grow">
				<p className="text-base-md text-base-neutral-900 dark:text-base-neutral-40">{label}</p>
				<p className="mt-1 text-base-sm text-base-neutral-600 dark:text-base-neutral-300">{description}</p>
			</div>
			<div className="shrink-0">{children}</div>
		</div>
	);
}

export function AppearanceSettings() {
	const mutation = useUserSettingsMutation();

	return (
		<div className="flex flex-col gap-4 md:gap-6">
			<SettingsPanelHeader>Appearance</SettingsPanelHeader>
			<section aria-label="Appearance preferences" className="flex flex-col gap-3">
				<SettingsRow description="My preferred theme for the tool" label="Visual theming">
					<VisualSwitch
						className="border-0 p-0"
						onThemeChange={(newTheme) => {
							mutation.mutate({ theme: newTheme as 'light' | 'dark' | 'system' });
						}}
					/>
				</SettingsRow>
			</section>
		</div>
	);
}

export function ViewSettings() {
	const { settings } = useUserSettings();
	const mutation = useUserSettingsMutation();

	return (
		<div className="flex flex-col gap-4 md:gap-6">
			<SettingsPanelHeader description="Customize your view settings for listed items">
				Customized view settings
			</SettingsPanelHeader>
			<section aria-labelledby="general-view-settings" className="flex flex-col gap-3">
				<h2 className="text-base-label-lg" id="general-view-settings">
					General
				</h2>
				<SettingsRow description="Default layout for listings on larger screens" label="Layout theme">
					<Select
						aria-label="Default layout"
						className="w-[157px]"
						isDisabled={mutation.isPending}
						onChange={(key) => {
							mutation.mutate({ defaultViewMode: String(key) as 'grid' | 'table' });
						}}
						value={settings.defaultViewMode}
					>
						<SelectTrigger />
						<SelectContent items={VIEW_MODE_OPTIONS}>
							{(item) => (
								<SelectItem id={item.id} textValue={item.label}>
									<SelectLabel className="inline-flex place-items-center gap-2 align-middle">
										<LayoutThemeIcon value={item.id} />
										<span data-slot="layout-label">{item.label}</span>
									</SelectLabel>
								</SelectItem>
							)}
						</SelectContent>
					</Select>
				</SettingsRow>
			</section>
		</div>
	);
}
