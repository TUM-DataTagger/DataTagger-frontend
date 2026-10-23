'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
	// CircleUserRoundIcon,
	FlaskConicalIcon,
	LogOutIcon,
	MoreVerticalIcon,
	SettingsIcon,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState } from 'react';
import { Drawer, DrawerBody, DrawerClose, DrawerContent, DrawerTrigger } from '@/components/ui/Drawer';
import { dropdownItemStyles } from '@/components/ui/Dropdown';
import { Separator } from '@/components/ui/Separator';
import { isFeatureFlagEnabled, useFeatureFlags } from '@/hooks/useFeatureFlags';
import { logout } from '@/server/actions/auth';
import { USER_SETTINGS_ENABLED_FLAG } from '@/util/featureFlagKeys';
import { VisualSwitchNoSSR } from './VisualSwitch';
import { MAIN_NAVIGATION_ITEMS } from './navigationItems';

export function MobileNavigation() {
	const queryClient = useQueryClient();
	const [isOpen, setIsOpen] = useState(false);
	const { data: flagsData } = useFeatureFlags();
	const isUserSettingsEnabled = isFeatureFlagEnabled(flagsData, USER_SETTINGS_ENABLED_FLAG);

	return (
		<div className="md:hidden">
			<Drawer isOpen={isOpen} onOpenChange={setIsOpen} withNotch={false}>
				<DrawerTrigger aria-label="Navigation" size="icon" variant="outline">
					<MoreVerticalIcon aria-hidden size={24} strokeWidth={1.5} />
				</DrawerTrigger>
				<DrawerContent aria-label="More menu">
					<DrawerBody>
						{MAIN_NAVIGATION_ITEMS.map((item) => {
							const Icon = item.icon;
							return (
								<Link
									aria-label={item.label}
									className={dropdownItemStyles({ className: 'text-base-sm flex gap-2' })}
									href={item.href}
									key={item.id}
									onClick={() => setIsOpen(false)}
								>
									<Icon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} /> {item.label}
								</Link>
							);
						})}
						<Separator />
						{/* TODO: User Profile */}
						{/* <Link
							aria-label="My profile"
							className={dropdownItemStyles({ className: 'text-base-sm flex gap-2' })}
							href="/my-profile"
							onClick={() => setIsOpen(false)}
						>
							<CircleUserRoundIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} /> My Profile
						</Link> */}
						<Link
							aria-label="eLabFTW connection"
							className={dropdownItemStyles({ className: 'text-base-sm flex gap-2' })}
							href="/account/elabftw"
							onClick={() => setIsOpen(false)}
						>
							<FlaskConicalIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} /> eLabFTW connection
						</Link>
						{isUserSettingsEnabled ? (
							<Link
								aria-label="Settings"
								className={dropdownItemStyles({ className: 'text-base-sm flex gap-2' })}
								href="/account/settings"
								onClick={() => setIsOpen(false)}
							>
								<SettingsIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} /> Settings
							</Link>
						) : null}
						<Separator />
						<DrawerClose
							className={dropdownItemStyles({ className: 'text-base-sm flex place-content-start gap-2' })}
							onPress={async () => {
								queryClient.clear();
								await logout();
							}}
							size="default"
							variant="unset"
						>
							<LogOutIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} /> Logout
						</DrawerClose>
						<Separator />
						<div className="mt-2 flex flex-col place-items-center gap-2 place-self-center">
							<span className="text-base-label-sm text-base-neutral-600 dark:text-base-neutral-300">
								Visual theming
							</span>
							<VisualSwitchNoSSR className="flex" />
						</div>
					</DrawerBody>
				</DrawerContent>
			</Drawer>
		</div>
	);
}

export const MobileNavigationNoSSR = dynamic(async () => MobileNavigation, { ssr: false });
