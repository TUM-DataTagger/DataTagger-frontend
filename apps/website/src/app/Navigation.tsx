import Link from 'next/link';
import { LogoIconNoSSR } from '@/components/icons/LogoIcon';
import { cx } from '@/styles/cva';
import { buttonStyles } from '@/styles/ui/button';
import { LogoutButton } from './LogoutButton';
import { MobileNavigationNoSSR } from './MobileNavigation';
import { SearchButtonNoSSR } from './SearchButton';
import { VisualSwitchNoSSR } from './VisualSwitch';

export async function Navigation({
	notFound = false,
	...props
}: {
	readonly className?: string;
	readonly notFound?: boolean;
}) {
	return (
		<div className="@container/navigation print:hidden">
			<div
				className={cx(
					'bg-base-neutral-0 dark:bg-base-neutral-800 border-base-neutral-100 dark:border-base-neutral-700 flex h-16 shrink-0 place-content-between place-items-center gap-6 border-b px-6 xl:px-[132px] @max-6xl/navigation:px-6',
					props.className,
				)}
			>
				<div className="flex place-items-center gap-4 md:grow md:gap-6">
					<div className="hidden place-items-center gap-4 md:flex @max-6xl/navigation:hidden">
						<LogoIconNoSSR />
						<Link
							className="text-base-lg focus-visible:outline-base-lavender-400 dark:outline-base-lavender-600 rounded-xs outline-0 outline-offset-2 focus-visible:outline-2 forced-colors:outline-[Highlight]"
							href="/drafts"
						>
							DataTagger
						</Link>
					</div>

					<div className="flex place-items-center gap-4 md:hidden @max-6xl/navigation:flex">
						<LogoIconNoSSR />
						<Link
							className="text-base-xs focus-visible:outline-base-lavender-400 dark:outline-base-lavender-600 flex flex-col rounded-xs leading-none outline-0 outline-offset-2 focus-visible:outline-2 forced-colors:outline-[Highlight]"
							href="/drafts"
						>
							Data
							<br />
							Tagger
						</Link>
					</div>

					<div className="hidden place-items-center gap-2 md:flex @max-4xl/navigation:hidden">
						<Link className={buttonStyles({ variant: 'discreet', className: 'h-8 shrink px-3 py-2' })} href="/drafts">
							My draft files
						</Link>
						<Link className={buttonStyles({ variant: 'discreet', className: 'h-8 shrink px-3 py-2' })} href="/projects">
							Projects
						</Link>
						<Link
							className={buttonStyles({ variant: 'discreet', className: 'h-8 shrink px-3 py-2' })}
							href="/metadata-templates"
						>
							Metadata templates
						</Link>
					</div>
				</div>
				<div className="flex place-items-center gap-4">
					{notFound ? null : <SearchButtonNoSSR />}
					<VisualSwitchNoSSR className="hidden md:flex" />
					<LogoutButton className="hidden md:flex" />
					<MobileNavigationNoSSR />
				</div>
			</div>
		</div>
	);
}
