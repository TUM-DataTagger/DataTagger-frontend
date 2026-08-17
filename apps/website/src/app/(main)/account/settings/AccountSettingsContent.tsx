'use client';

import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react';
import type { RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@/components/ui/Tabs';
import { DraftFilesSettings, ProjectResourceSettings } from './PageSettings';
import { AppearanceSettings, ViewSettings } from './PreferencesTab';

const futureSettings = ['Metadata templates', 'Search'] as const;
type SettingsSection = 'appearance' | 'view-settings' | 'draft-files' | 'project-resources';

const sectionOrder: readonly SettingsSection[] = ['appearance', 'view-settings', 'draft-files', 'project-resources'];

const sectionLabels: Readonly<Record<SettingsSection, string>> = {
	appearance: 'Appearance',
	'view-settings': 'Customized view settings',
	'draft-files': 'My draft files',
	'project-resources': 'Projects, Folders, Files',
};

const tabClassName =
	'h-10 w-full rounded-sm bg-base-lavender-100/56 px-3 py-2.5 text-left text-base-md text-base-neutral-900 outline-0 outline-offset-2 hover:bg-base-lavender-200 focus-visible:bg-base-lavender-200 focus-visible:outline-2 focus-visible:outline-base-lavender-400 pressed:bg-base-lavender-600 pressed:text-base-neutral-40 selected:bg-base-lavender-300 selected:hover:bg-base-lavender-500 selected:focus-visible:bg-base-lavender-500 selected:pressed:bg-base-lavender-600 selected:pressed:text-base-neutral-40 dark:bg-base-lavender-900/38 dark:text-base-neutral-40 dark:hover:bg-base-lavender-800 dark:focus-visible:bg-base-lavender-800 dark:focus-visible:outline-base-lavender-600 dark:pressed:bg-base-lavender-400 dark:pressed:text-base-neutral-900 dark:selected:bg-base-lavender-700 dark:selected:hover:bg-base-lavender-500 dark:selected:hover:text-base-neutral-900 dark:selected:focus-visible:bg-base-lavender-500 dark:selected:focus-visible:text-base-neutral-900 dark:selected:pressed:bg-base-lavender-400 dark:selected:pressed:text-base-neutral-900';

function SettingsMenuHeading({ children }: { readonly children: string }) {
	return <p className="pb-3 text-base-xl text-base-neutral-600 dark:text-base-neutral-300">{children}</p>;
}

const mobileMenuButtonClassName =
	'flex min-h-10 w-full place-content-start justify-between rounded-sm bg-base-lavender-100/56 px-3 py-2.5 text-left text-base-md text-base-neutral-900 hover:bg-base-lavender-200 focus-visible:bg-base-lavender-200 pressed:bg-base-lavender-600 pressed:text-base-neutral-40 dark:bg-base-lavender-900/38 dark:text-base-neutral-40 dark:hover:bg-base-lavender-800 dark:focus-visible:bg-base-lavender-800 dark:pressed:bg-base-lavender-400 dark:pressed:text-base-neutral-900';

const disabledMenuItemClassName =
	'flex min-h-10 w-full place-items-center justify-between gap-4 rounded-sm border border-base-neutral-200 bg-transparent py-2.5 pr-4 pl-3 text-base-md text-base-neutral-900 opacity-38 dark:border-base-neutral-700 dark:text-base-neutral-40';

function MobileSettingsMenu({
	appearanceButtonRef,
	draftFilesButtonRef,
	onSelect,
	projectResourcesButtonRef,
	viewSettingsButtonRef,
}: {
	readonly appearanceButtonRef: RefObject<HTMLButtonElement | null>;
	readonly draftFilesButtonRef: RefObject<HTMLButtonElement | null>;
	onSelect(section: SettingsSection): void;
	readonly projectResourcesButtonRef: RefObject<HTMLButtonElement | null>;
	readonly viewSettingsButtonRef: RefObject<HTMLButtonElement | null>;
}) {
	return (
		<nav aria-label="Settings" className="flex w-full flex-col px-4 py-8">
			<SettingsMenuHeading>General settings</SettingsMenuHeading>
			<div className="flex flex-col gap-2">
				<Button
					className={mobileMenuButtonClassName}
					onPress={() => onSelect('appearance')}
					ref={appearanceButtonRef}
					variant="unset"
				>
					<span>Appearance</span>
					<ArrowRightIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} />
				</Button>
				<Button
					className={mobileMenuButtonClassName}
					onPress={() => onSelect('view-settings')}
					ref={viewSettingsButtonRef}
					variant="unset"
				>
					<span>Customized view settings</span>
					<ArrowRightIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} />
				</Button>
			</div>

			<div aria-labelledby="mobile-page-settings-heading" className="mt-4">
				<p
					className="pb-3 text-base-xl text-base-neutral-600 dark:text-base-neutral-300"
					id="mobile-page-settings-heading"
				>
					Settings per page
				</p>
				<div className="flex flex-col gap-2">
					<Button
						className={mobileMenuButtonClassName}
						onPress={() => onSelect('draft-files')}
						ref={draftFilesButtonRef}
						variant="unset"
					>
						<span>My draft files</span>
						<ArrowRightIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} />
					</Button>
					<Button
						className={mobileMenuButtonClassName}
						onPress={() => onSelect('project-resources')}
						ref={projectResourcesButtonRef}
						variant="unset"
					>
						<span>Projects, Folders, Files</span>
						<ArrowRightIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} />
					</Button>
					<ul className="flex flex-col gap-2">
						{futureSettings.map((setting) => (
							<li key={setting}>
								<span className={disabledMenuItemClassName}>
									{setting}
									<ArrowRightIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} />
									<span className="sr-only"> (coming soon)</span>
								</span>
							</li>
						))}
					</ul>
				</div>
			</div>
		</nav>
	);
}

function MobileSectionNavigation({
	onSelect,
	section,
}: {
	onSelect(section: SettingsSection): void;
	readonly section: SettingsSection;
}) {
	const sectionIndex = sectionOrder.indexOf(section);
	const previousSection = sectionOrder[sectionIndex - 1];
	const nextSection = sectionOrder[sectionIndex + 1];

	return (
		<nav aria-label="Adjacent settings sections" className="mt-4 grid min-h-10 grid-cols-2 place-items-center gap-4">
			{previousSection ? (
				<Button
					className="w-full justify-start gap-1 px-0 text-left text-base-label-sm whitespace-normal text-base-lavender-600 dark:text-base-lavender-400"
					onPress={() => onSelect(previousSection)}
					variant="secondary-discreet"
				>
					<ArrowLeftIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} />
					{sectionLabels[previousSection]}
				</Button>
			) : (
				<span />
			)}
			{nextSection ? (
				<Button
					className="w-full justify-end gap-1 px-0 text-right text-base-label-sm whitespace-normal text-base-lavender-600 dark:text-base-lavender-400"
					onPress={() => onSelect(nextSection)}
					variant="secondary-discreet"
				>
					{sectionLabels[nextSection]}
					<ArrowRightIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} />
				</Button>
			) : null}
		</nav>
	);
}

function MobileSettingsDetail({
	backButtonRef,
	onBack,
	onSelect,
	section,
}: {
	readonly backButtonRef: RefObject<HTMLButtonElement | null>;
	onBack(): void;
	onSelect(section: SettingsSection): void;
	readonly section: SettingsSection;
}) {
	const content = {
		appearance: <AppearanceSettings />,
		'view-settings': <ViewSettings />,
		'draft-files': <DraftFilesSettings />,
		'project-resources': <ProjectResourceSettings />,
	}[section];

	return (
		<div className="w-full">
			<div className="flex h-16 place-items-center border-b border-base-neutral-100 bg-base-neutral-60 px-4 dark:border-base-neutral-700 dark:bg-base-neutral-800">
				<Button
					className="h-10 px-0 text-base-xl text-base-neutral-900 dark:text-base-neutral-40"
					onPress={onBack}
					ref={backButtonRef}
					variant="unset"
				>
					<ArrowLeftIcon aria-hidden size={24} strokeWidth={1.5} />
					Settings
				</Button>
			</div>
			<div className="px-4 py-6">
				{content}
				<MobileSectionNavigation onSelect={onSelect} section={section} />
			</div>
		</div>
	);
}

function DesktopSettings() {
	return (
		<Tabs
			className="hidden w-full max-w-[1236px] grid-cols-[clamp(240px,32%,396px)_minmax(0,1fr)] items-start gap-6 md:grid"
			defaultSelectedKey="appearance"
			orientation="vertical"
		>
			<nav aria-label="Settings" className="relative flex min-w-0 flex-col">
				<SettingsMenuHeading>General settings</SettingsMenuHeading>
				<TabList className="w-full min-w-0 flex-col gap-2 border-0 p-0" selectionIndicator={false}>
					<Tab className={tabClassName} id="appearance">
						Appearance
					</Tab>
					<Tab className={tabClassName} id="view-settings">
						Customized view settings
					</Tab>
					<Tab className={`${tabClassName} mt-14`} id="draft-files">
						My draft files
					</Tab>
					<Tab className={tabClassName} id="project-resources">
						Projects, Folders, Files
					</Tab>
				</TabList>

				<div aria-labelledby="page-settings-heading" className="pointer-events-none absolute top-36">
					<p className="text-base-xl text-base-neutral-600 dark:text-base-neutral-300" id="page-settings-heading">
						Settings per page
					</p>
				</div>
				<div className="mt-2">
					<ul className="flex flex-col gap-2">
						{futureSettings.map((setting) => (
							<li key={setting}>
								<span className={disabledMenuItemClassName}>
									{setting}
									<span className="sr-only"> (coming soon)</span>
								</span>
							</li>
						))}
					</ul>
				</div>
			</nav>
			<TabPanels className="min-w-0 pt-12">
				<TabPanel id="appearance">
					<AppearanceSettings />
				</TabPanel>
				<TabPanel id="view-settings">
					<ViewSettings />
				</TabPanel>
				<TabPanel id="draft-files">
					<DraftFilesSettings />
				</TabPanel>
				<TabPanel id="project-resources">
					<ProjectResourceSettings />
				</TabPanel>
			</TabPanels>
		</Tabs>
	);
}

export function AccountSettingsContent() {
	const [mobileSection, setMobileSection] = useState<SettingsSection | null>(null);
	const appearanceButtonRef = useRef<HTMLButtonElement>(null);
	const backButtonRef = useRef<HTMLButtonElement>(null);
	const draftFilesButtonRef = useRef<HTMLButtonElement>(null);
	const previousSectionRef = useRef<SettingsSection | null>(null);
	const projectResourcesButtonRef = useRef<HTMLButtonElement>(null);
	const viewSettingsButtonRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (mobileSection) {
			backButtonRef.current?.focus();
		}
	}, [mobileSection]);

	function selectMobileSection(section: SettingsSection) {
		previousSectionRef.current = section;
		setMobileSection(section);
	}

	function closeMobileSection() {
		const previousSection = previousSectionRef.current;
		setMobileSection(null);
		requestAnimationFrame(() => {
			const buttonRefs: Readonly<Record<SettingsSection, RefObject<HTMLButtonElement | null>>> = {
				appearance: appearanceButtonRef,
				'view-settings': viewSettingsButtonRef,
				'draft-files': draftFilesButtonRef,
				'project-resources': projectResourcesButtonRef,
			};
			if (previousSection) buttonRefs[previousSection].current?.focus();
		});
	}

	return (
		<>
			<div className="w-full md:hidden">
				{mobileSection ? (
					<MobileSettingsDetail
						backButtonRef={backButtonRef}
						onBack={closeMobileSection}
						onSelect={selectMobileSection}
						section={mobileSection}
					/>
				) : (
					<MobileSettingsMenu
						appearanceButtonRef={appearanceButtonRef}
						draftFilesButtonRef={draftFilesButtonRef}
						onSelect={selectMobileSection}
						projectResourcesButtonRef={projectResourcesButtonRef}
						viewSettingsButtonRef={viewSettingsButtonRef}
					/>
				)}
			</div>
			<DesktopSettings />
		</>
	);
}
