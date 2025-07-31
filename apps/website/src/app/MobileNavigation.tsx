'use client';

import { BlocksIcon, MoreVerticalIcon, PackageIcon, PackageOpenIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState } from 'react';
import { Drawer, DrawerBody, DrawerContent, DrawerTrigger } from '@/components/ui/Drawer';
import { dropdownItemStyles } from '@/components/ui/Dropdown';
import { Separator } from '@/components/ui/Separator';
import { LogoutButton } from './LogoutButton';
import { VisualSwitchNoSSR } from './VisualSwitch';

export function MobileNavigation() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="md:hidden">
			<Drawer isOpen={isOpen} onOpenChange={setIsOpen} withNotch={false}>
				<DrawerTrigger aria-label="Navigation" size="icon" variant="outline">
					<MoreVerticalIcon aria-hidden size={24} strokeWidth={1.5} />
				</DrawerTrigger>
				<DrawerContent aria-label="More menu">
					<DrawerBody>
						<Link
							aria-label="My draft files"
							className={dropdownItemStyles({ className: 'text-base-sm flex gap-2' })}
							href="/drafts"
							onClick={() => setIsOpen(false)}
						>
							<PackageOpenIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} /> My draft files
						</Link>
						<Link
							aria-label="Projects"
							className={dropdownItemStyles({ className: 'text-base-sm flex gap-2' })}
							href="/projects"
							onClick={() => setIsOpen(false)}
						>
							<PackageIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} /> Projects
						</Link>
						<Link
							aria-label="Metadata templates"
							className={dropdownItemStyles({ className: 'text-base-sm flex gap-2' })}
							href="/metadata-templates"
							onClick={() => setIsOpen(false)}
						>
							<BlocksIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} /> Metadata templates
						</Link>
						<LogoutButton
							className={dropdownItemStyles({ className: 'text-base-sm flex place-content-start gap-2' })}
							onClick={() => setIsOpen(false)}
							size="default"
							variant="unset"
						>
							Logout
						</LogoutButton>
						<Separator />
						<div className="mt-2 flex flex-col place-items-center gap-2 place-self-center">
							<span className="text-base-label-sm text-base-neutral-600 dark:text-base-neutral-300">
								Visual theming
							</span>
							<VisualSwitchNoSSR />
						</div>
					</DrawerBody>
				</DrawerContent>
			</Drawer>
		</div>
	);
}

export const MobileNavigationNoSSR = dynamic(async () => MobileNavigation, { ssr: false });
