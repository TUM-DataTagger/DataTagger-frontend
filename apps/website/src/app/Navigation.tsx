import Link from 'next/link';
import { LogoIconNoSSR } from '@/components/icons/LogoIcon';
import { cx } from '@/styles/cva';
import { buttonStyles } from '@/styles/ui/button';
import { CommandMenu } from './CommandMenu';
import { MobileNavigationNoSSR } from './MobileNavigation';
import { UserMenu } from './UserMenu';
import { DESKTOP_HEADER_NAVIGATION_ITEMS } from './navigationItems';

export async function Navigation({
	notFound = false,
	...props
}: {
	readonly className?: string;
	readonly notFound?: boolean;
}) {
	return (
		<div className="@container/navigation z-50 print:hidden">
			<div
				className={cx(
					'flex h-16 shrink-0 place-content-between place-items-center gap-6 border-b border-base-neutral-100 bg-base-neutral-0 px-6 xl:px-[132px] @max-6xl/navigation:px-6 dark:border-base-neutral-700 dark:bg-base-neutral-800',
					props.className,
				)}
			>
				<nav aria-label="Primary" className="flex place-items-center gap-4 md:grow md:gap-6">
					<div className="hidden place-items-center gap-4 md:flex @max-6xl/navigation:hidden">
						<LogoIconNoSSR />
						<Link
							className="rounded-xs text-base-lg outline-0 outline-offset-2 focus-visible:outline-2 focus-visible:outline-base-lavender-400 dark:outline-base-lavender-600 forced-colors:outline-[Highlight]"
							href="/"
						>
							DataTagger
						</Link>
					</div>

					<div className="flex place-items-center gap-4 md:hidden @max-6xl/navigation:flex">
						<LogoIconNoSSR />
						<Link
							className="flex flex-col rounded-xs text-base-xs leading-none outline-0 outline-offset-2 focus-visible:outline-2 focus-visible:outline-base-lavender-400 dark:outline-base-lavender-600 forced-colors:outline-[Highlight]"
							href="/drafts"
						>
							Data
							<br />
							Tagger
						</Link>
					</div>

					<div className="hidden place-items-center gap-2 md:flex @max-4xl/navigation:hidden">
						{DESKTOP_HEADER_NAVIGATION_ITEMS.map((item) => (
							<Link
								className={buttonStyles({ variant: 'discreet', className: 'h-8 shrink px-3 py-2' })}
								href={item.href}
								key={item.id}
							>
								{item.label}
							</Link>
						))}
					</div>
				</nav>
				<div className="flex place-items-center gap-4">
					{notFound ? null : <CommandMenu />}
					<UserMenu className="hidden md:flex" />
					<MobileNavigationNoSSR />
				</div>
			</div>
		</div>
	);
}
