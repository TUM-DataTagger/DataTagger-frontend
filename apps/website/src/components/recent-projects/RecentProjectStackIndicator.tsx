import { FileStackIconNoSSR } from '@/components/icons/FileStackIcon';
import { FolderStackIconNoSSR } from '@/components/icons/FolderStackIcon';
import { ProjectStackIconNoSSR } from '@/components/icons/ProjectStackIcon';

const sharedTileClass =
	'flex place-content-center place-items-center rounded bg-base-lavender-100/48 text-base-lavender-700 group-hover:bg-base-neutral-60 group-focus-visible:bg-base-neutral-60 group-pressed:bg-base-neutral-60 dark:bg-base-lavender-900/48 dark:text-base-lavender-300 dark:group-hover:bg-base-neutral-700/38 dark:group-focus-visible:bg-base-neutral-700/38 dark:group-pressed:bg-base-neutral-700/38';

const iconClass = 'shrink-0 duration-200 group-hover:rotate-15 group-pressed:rotate-0';

const indicatorStyles = {
	grid: {
		wrapper: 'grid grid-cols-2 gap-1',
		tile: `${sharedTileClass} h-12 max-h-12 gap-2`,
		count: 'text-base-label-md',
	},
	table: {
		wrapper: 'flex w-full gap-1',
		tile: `${sharedTileClass} h-10 min-w-0 flex-1 gap-1 px-1 py-3`,
		count: 'text-base-md',
	},
} as const;

type RecentProjectStackIndicatorVariant = keyof typeof indicatorStyles;
type RecentProjectStackType = 'file' | 'folder';

function hasCount(count: number | undefined): count is number {
	return typeof count === 'number' && count > 0;
}

function RecentProjectCountTile(props: {
	readonly count: number;
	readonly type: RecentProjectStackType;
	readonly variant: RecentProjectStackIndicatorVariant;
}) {
	const label = props.type === 'folder' ? `${props.count} folders` : `${props.count} files`;
	const styles = indicatorStyles[props.variant];

	return (
		<div aria-label={label} className={styles.tile}>
			{props.type === 'folder' ? (
				<FolderStackIconNoSSR aria-hidden className={iconClass} />
			) : (
				<FileStackIconNoSSR aria-hidden className={iconClass} />
			)}
			<span className={styles.count}>{props.count}</span>
		</div>
	);
}

export function RecentProjectStackIndicator(props: {
	readonly datasetsCount?: number;
	readonly foldersCount?: number;
	readonly variant: RecentProjectStackIndicatorVariant;
}) {
	const showFolders = hasCount(props.foldersCount);
	const showFiles = hasCount(props.datasetsCount);
	const styles = indicatorStyles[props.variant];

	if (showFolders && showFiles) {
		return (
			<div className={styles.wrapper}>
				<RecentProjectCountTile count={props.foldersCount} type="folder" variant={props.variant} />
				<RecentProjectCountTile count={props.datasetsCount} type="file" variant={props.variant} />
			</div>
		);
	}

	if (showFolders) {
		return <RecentProjectCountTile count={props.foldersCount} type="folder" variant={props.variant} />;
	}

	if (showFiles) {
		return <RecentProjectCountTile count={props.datasetsCount} type="file" variant={props.variant} />;
	}

	return (
		<div className={styles.tile}>
			<ProjectStackIconNoSSR className={iconClass} />
		</div>
	);
}
