'use client';

import { useQueryClient } from '@tanstack/react-query';
import { LogOutIcon } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { logout } from '@/actions/logout';
import type { ButtonProps } from '@/components/ui/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';

export function LogoutButton({ onClick, ...props }: PropsWithChildren<ButtonProps & { onClick?(): void }>) {
	const queryClient = useQueryClient();

	return (
		<Tooltip delay={400}>
			<TooltipTrigger
				{...props}
				aria-label="Logout"
				onPress={async () => {
					onClick?.();
					queryClient.clear();
					await logout();
				}}
				size={props.size ?? 'icon'}
			>
				<LogOutIcon aria-hidden size={18} strokeWidth={1.5} />
				{props.children}
			</TooltipTrigger>
			<TooltipContent showArrow={false}>Logout</TooltipContent>
		</Tooltip>
	);
}
