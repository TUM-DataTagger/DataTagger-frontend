import {
	BlocksIcon,
	FlaskConicalIcon,
	PackageIcon,
	PackageOpenIcon,
	ScanSearchIcon,
	type LucideIcon,
} from 'lucide-react';

export type MainNavigationItem = {
	readonly href: string;
	readonly icon: LucideIcon;
	readonly id: string;
	readonly label: string;
	readonly showInDesktopHeader?: true;
};

export const MAIN_NAVIGATION_ITEMS: readonly MainNavigationItem[] = [
	{
		href: '/drafts',
		icon: PackageOpenIcon,
		id: 'drafts',
		label: 'My draft files',
		showInDesktopHeader: true,
	},
	{
		href: '/projects',
		icon: PackageIcon,
		id: 'projects',
		label: 'Projects',
		showInDesktopHeader: true,
	},
	{
		href: '/experiments',
		icon: FlaskConicalIcon,
		id: 'experiments',
		label: 'Experiments',
		showInDesktopHeader: true,
	},
	{
		href: '/metadata-templates',
		icon: BlocksIcon,
		id: 'metadata-templates',
		label: 'Metadata templates',
	},
	{
		href: '/search',
		icon: ScanSearchIcon,
		id: 'advanced-search',
		label: 'Advanced search',
	},
] as const;

export const DESKTOP_HEADER_NAVIGATION_ITEMS = MAIN_NAVIGATION_ITEMS.filter(
	(item) => item.showInDesktopHeader === true,
);
