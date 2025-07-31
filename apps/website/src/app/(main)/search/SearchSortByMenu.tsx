'use client';

import { useQueryClient } from '@tanstack/react-query';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { Selection } from 'react-aria-components';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@/components/ui/Menu';

const sortOptions = {
	'-creation_date': 'Created last',
	creation_date: 'Created first',
	display_name: 'Name A-Z',
	'-display_name': 'Name Z-A',
	'-expiry_date': 'Closer to auto-delete',
};

export function SearchSortByMenu({ isDisabled = false }: { readonly isDisabled?: boolean }) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [selected, setSelected] = useState<Selection>(new Set([searchParams.get('sort') ?? 'display_name']));
	const [_, startTransition] = useTransition();

	const handleSort = async (sort = 'display_name') => {
		await queryClient.invalidateQueries({ queryKey: ['search'] });

		startTransition(() => {
			const params = new URLSearchParams(searchParams);
			params.set('sort', sort);
			router.replace(`${pathname}?${params.toString()}`, { scroll: false });
		});
	};

	return (
		<Menu isOpen={isMenuOpen} onOpenChange={setIsMenuOpen} respectScreen={false}>
			<MenuTrigger
				aria-label="Sorting menu"
				className="pressed:outline-2 pressed:outline-offset-2 pressed:outline-base-lavender-400 dark:pressed:outline-base-lavender-600 h-8 gap-2"
				isDisabled={isDisabled}
				variant="discreet"
			>
				<span>
					Sort by:{' '}
					<span className="text-base-label-md">
						{[...selected].map((key) => sortOptions[key as keyof typeof sortOptions]).join(', ')}
					</span>
				</span>
				{isMenuOpen ? (
					<ChevronUpIcon aria-hidden size={18} strokeWidth={1.5} />
				) : (
					<ChevronDownIcon aria-hidden size={18} strokeWidth={1.5} />
				)}
			</MenuTrigger>
			<MenuContent
				disallowEmptySelection
				onSelectionChange={setSelected}
				placement="bottom"
				selectedKeys={selected}
				selectionMode="single"
			>
				<MenuItem id="-creation_date" onAction={async () => handleSort('-creation_date')}>
					Created last
				</MenuItem>
				<MenuItem id="creation_date" onAction={async () => handleSort('creation_date')}>
					Created first
				</MenuItem>
				<MenuItem id="display_name" onAction={async () => handleSort('display_name')}>
					Name A-Z
				</MenuItem>
				<MenuItem id="-display_name" onAction={async () => handleSort('-display_name')}>
					Name Z-A
				</MenuItem>
				<MenuItem id="-expiry_date" onAction={async () => handleSort('-expiry_date')}>
					Closer to auto-delete
				</MenuItem>
			</MenuContent>
		</Menu>
	);
}
