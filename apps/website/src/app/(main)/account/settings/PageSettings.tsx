'use client';

import { HelpCircleIcon, PackageOpenIcon } from 'lucide-react';
import type { Key } from 'react-aria-components';
import { Select, SelectContent, SelectItem, SelectLabel, SelectTrigger } from '@/components/ui/Select';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@/components/ui/Tabs';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useUserSettingsMutation } from '@/hooks/useUserSettingsMutation';
import type { UserSettings } from '@/schemas/UserSettingsSchema';
import {
	DRAFT_SORT_OPTIONS,
	FILE_SORT_OPTIONS,
	FOLDER_SORT_OPTIONS,
	PROJECT_SORT_OPTIONS,
	VIEW_MODE_OVERRIDE_OPTIONS,
} from '@/util/userSettingsOptions';
import { LayoutThemeIcon, SettingsPanelHeader, SettingsRow } from './PreferencesTab';

const draftSortOptions = Object.entries(DRAFT_SORT_OPTIONS).map(([id, label]) => ({ id, label }));
const projectSortOptions = Object.entries(PROJECT_SORT_OPTIONS).map(([id, label]) => ({ id, label }));
const folderSortOptions = Object.entries(FOLDER_SORT_OPTIONS).map(([id, label]) => ({ id, label }));
const fileSortOptions = Object.entries(FILE_SORT_OPTIONS).map(([id, label]) => ({ id, label }));

type SelectOption = { readonly id: string; readonly label: string };

function PreferenceSelect({
	ariaLabel,
	isDisabled,
	onChange,
	options,
	showLayoutIcons = false,
	value,
}: {
	readonly ariaLabel: string;
	readonly isDisabled: boolean;
	onChange(key: Key): void;
	readonly options: readonly SelectOption[];
	readonly showLayoutIcons?: boolean;
	readonly value: string;
}) {
	return (
		<Select
			aria-label={ariaLabel}
			className={showLayoutIcons ? 'w-[157px]' : 'w-[203px] max-w-[46vw] md:max-w-none'}
			isDisabled={isDisabled}
			onChange={(key) => {
				if (key !== null) onChange(key);
			}}
			value={value}
		>
			<SelectTrigger />
			<SelectContent items={options}>
				{(item) => (
					<SelectItem id={item.id} textValue={item.label}>
						<SelectLabel className={showLayoutIcons ? 'inline-flex place-items-center gap-2' : undefined}>
							{showLayoutIcons ? <LayoutThemeIcon value={item.id as UserSettings['draftsViewMode']} /> : null}
							{showLayoutIcons ? <span data-slot="layout-label">{item.label}</span> : item.label}
						</SelectLabel>
					</SelectItem>
				)}
			</SelectContent>
		</Select>
	);
}

function ResourcePreferences({
	ariaPrefix,
	isDisabled,
	layoutDescription,
	layoutValue,
	onLayoutChange,
	onSortChange,
	sortDescription,
	sortOptions,
	sortValue,
}: {
	readonly ariaPrefix: string;
	readonly isDisabled: boolean;
	readonly layoutDescription: string;
	readonly layoutValue: string;
	onLayoutChange(value: string): void;
	onSortChange(value: string): void;
	readonly sortDescription: string;
	readonly sortOptions: readonly SelectOption[];
	readonly sortValue: string;
}) {
	return (
		<section aria-label="Sorting and layout preferences" className="flex flex-col gap-3">
			<h2 className="text-base-label-lg">Sorting</h2>
			<SettingsRow description={sortDescription} label="Sort option">
				<PreferenceSelect
					ariaLabel={`${ariaPrefix} default sort option`}
					isDisabled={isDisabled}
					onChange={(key) => onSortChange(String(key))}
					options={sortOptions}
					value={sortValue}
				/>
			</SettingsRow>
			<h2 className="mt-1 text-base-label-lg">Layout</h2>
			<SettingsRow description={layoutDescription} label="Layout theme">
				<PreferenceSelect
					ariaLabel={`${ariaPrefix} layout theme override`}
					isDisabled={isDisabled}
					onChange={(key) => onLayoutChange(String(key))}
					options={VIEW_MODE_OVERRIDE_OPTIONS}
					showLayoutIcons
					value={layoutValue}
				/>
			</SettingsRow>
		</section>
	);
}

export function DraftFilesSettings() {
	const { settings } = useUserSettings();
	const mutation = useUserSettingsMutation();

	return (
		<div className="flex flex-col gap-4 md:gap-6">
			<SettingsPanelHeader
				description="Customize your view settings for listed files"
				descriptionIcon={<HelpCircleIcon aria-hidden size={18} strokeWidth={1.5} />}
				icon={<PackageOpenIcon aria-hidden size={24} strokeWidth={1.5} />}
			>
				My draft files
			</SettingsPanelHeader>
			<section aria-label="Draft sorting and layout preferences" className="flex flex-col gap-3">
				<h2 className="text-base-label-lg">Sorting</h2>
				<SettingsRow description="Default sort option for listed files" label="Sort option">
					<PreferenceSelect
						ariaLabel="Drafts default sort option"
						isDisabled={mutation.isPending}
						onChange={(key) => mutation.mutate({ draftsSort: String(key) as UserSettings['draftsSort'] })}
						options={draftSortOptions}
						value={settings.draftsSort}
					/>
				</SettingsRow>
				<h2 className="mt-1 text-base-label-lg">Layout</h2>
				<SettingsRow description="Override the general layout theme for draft files" label="Layout theme">
					<PreferenceSelect
						ariaLabel="Drafts layout theme override"
						isDisabled={mutation.isPending}
						onChange={(key) => mutation.mutate({ draftsViewMode: String(key) as UserSettings['draftsViewMode'] })}
						options={VIEW_MODE_OVERRIDE_OPTIONS}
						showLayoutIcons
						value={settings.draftsViewMode}
					/>
				</SettingsRow>
			</section>
		</div>
	);
}

export function ProjectResourceSettings() {
	const { settings } = useUserSettings();
	const mutation = useUserSettingsMutation();

	return (
		<div className="flex flex-col gap-4 md:gap-6">
			<SettingsPanelHeader description="Customize your view settings for listed items">
				Projects, Folders, Files
			</SettingsPanelHeader>
			<Tabs className="gap-0" defaultSelectedKey="projects">
				<TabList aria-label="Resource type">
					<Tab id="projects">Projects</Tab>
					<Tab id="folders">Folders</Tab>
					<Tab id="files">Files</Tab>
				</TabList>
				<TabPanels>
					<TabPanel className="pt-4" id="projects">
						<ResourcePreferences
							ariaPrefix="Projects"
							isDisabled={mutation.isPending}
							layoutDescription="Override the general layout theme for projects"
							layoutValue={settings.projectsViewMode}
							onLayoutChange={(value) =>
								mutation.mutate({ projectsViewMode: value as UserSettings['projectsViewMode'] })
							}
							onSortChange={(value) => mutation.mutate({ projectsSort: value as UserSettings['projectsSort'] })}
							sortDescription="Default sort option for listed projects"
							sortOptions={projectSortOptions}
							sortValue={settings.projectsSort}
						/>
					</TabPanel>
					<TabPanel className="pt-4" id="folders">
						<ResourcePreferences
							ariaPrefix="Folders"
							isDisabled={mutation.isPending}
							layoutDescription="Override the general layout theme for folders"
							layoutValue={settings.foldersViewMode}
							onLayoutChange={(value) => mutation.mutate({ foldersViewMode: value as UserSettings['foldersViewMode'] })}
							onSortChange={(value) => mutation.mutate({ foldersSort: value as UserSettings['foldersSort'] })}
							sortDescription="Default sort option for listed folders"
							sortOptions={folderSortOptions}
							sortValue={settings.foldersSort}
						/>
					</TabPanel>
					<TabPanel className="pt-4" id="files">
						<ResourcePreferences
							ariaPrefix="Files"
							isDisabled={mutation.isPending}
							layoutDescription="Override the general layout theme for files"
							layoutValue={settings.filesViewMode}
							onLayoutChange={(value) => mutation.mutate({ filesViewMode: value as UserSettings['filesViewMode'] })}
							onSortChange={(value) => mutation.mutate({ filesSort: value as UserSettings['filesSort'] })}
							sortDescription="Default sort option for listed files"
							sortOptions={fileSortOptions}
							sortValue={settings.filesSort}
						/>
					</TabPanel>
				</TabPanels>
			</Tabs>
		</div>
	);
}
