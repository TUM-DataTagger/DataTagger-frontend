'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
	ChevronDownIcon,
	// CircleUserRoundIcon,
	FlaskConicalIcon,
	LogOutIcon,
	SettingsIcon,
	UserRoundIcon,
} from 'lucide-react';
import type { ButtonProps } from '@/components/ui/Button';
import { Menu, MenuContent, MenuHeader, MenuItem, MenuSeparator, MenuTrigger } from '@/components/ui/Menu';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { isFeatureFlagEnabled, useFeatureFlags } from '@/hooks/useFeatureFlags';
import { logout } from '@/server/actions/auth';
import { cx } from '@/styles/cva';
import { buttonStyles } from '@/styles/ui/button';
import { USER_SETTINGS_ENABLED_FLAG } from '@/util/featureFlagKeys';
import { VisualSwitchNoSSR } from './VisualSwitch';

export function UserMenu(props: ButtonProps) {
	const queryClient = useQueryClient();

	const { currentUserData } = useCurrentUser();
	const { data: flagsData } = useFeatureFlags();
	const isUserSettingsEnabled = isFeatureFlagEnabled(flagsData, USER_SETTINGS_ENABLED_FLAG);

	return (
		<Menu>
			<MenuTrigger {...props} className={cx('group', props.className)} size="icon" variant="secondary-tonal">
				<UserRoundIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} />
				<span
					className={buttonStyles({
						variant: 'secondary-tonal',
						size: 'icon-sm',
						className: cx(
							'absolute right-0 bottom-0 size-3! p-[3px]! *:data-[slot=icon]:size-3',
							'group-aria-expanded:rotate-180',
							'group-hover:border-transparent group-hover:bg-base-lavender-500 group-hover:text-base-neutral-900',
							'group-focus-visible:border-transparent group-focus-visible:bg-base-lavender-500 group-focus-visible:text-base-neutral-900',
							'group-pressed:border-transparent group-pressed:bg-base-lavender-600 group-pressed:text-base-neutral-40 dark:group-pressed:bg-base-lavender-400 dark:group-pressed:text-base-neutral-900',
						),
					})}
				>
					<ChevronDownIcon aria-hidden data-slot="icon" size={6} strokeWidth={1.5} />
				</span>
			</MenuTrigger>
			<MenuContent className="py-0" popover={{ className: 'rounded-lg', arrow: false, placement: 'bottom end' }}>
				<MenuHeader separator className="mb-2 rounded-t-lg">
					<span className="flex place-items-center gap-3">
						<span className="size-8 place-content-center place-items-center rounded-full bg-base-neutral-700 dark:bg-base-neutral-200">
							<UserRoundIcon
								aria-hidden
								className="text-base-neutral-40 dark:text-base-neutral-900"
								data-slot="icon"
								size={18}
								strokeWidth={1.5}
							/>
						</span>
						{currentUserData?.email}
					</span>
				</MenuHeader>
				{/* TODO: User Profile */}
				{/* <MenuItem aria-label="My profile" id="my-profile" key="my-profile">
					<CircleUserRoundIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} /> My Profile
				</MenuItem> */}
				<MenuItem aria-label="eLabFTW connection" href="/account/elabftw" id="elabftw">
					<FlaskConicalIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} /> eLabFTW connection
				</MenuItem>
				{isUserSettingsEnabled ? null : <MenuSeparator />}
				{isUserSettingsEnabled ? (
					<>
						<MenuItem aria-label="Settings" href="/account/settings" id="settings">
							<SettingsIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} /> Settings
						</MenuItem>
						<MenuSeparator />
					</>
				) : null}
				<MenuItem
					aria-label="Logout"
					id="logout"
					key="logout"
					onAction={async () => {
						queryClient.clear();
						await logout();
					}}
				>
					<LogOutIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} /> Logout
				</MenuItem>
				<MenuHeader separator className="mt-2 rounded-b-lg border-t border-b-0">
					<div className="flex flex-col place-items-center gap-2 place-self-center">
						<span className="text-base-xs text-base-neutral-600 dark:text-base-neutral-300">Visual theming</span>
						<VisualSwitchNoSSR className="flex border-0" />
					</div>
				</MenuHeader>
			</MenuContent>
		</Menu>
	);
}
