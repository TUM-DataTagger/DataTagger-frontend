'use client';

import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { useState } from 'react';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@/components/ui/Menu';
import { SEARCH_LIMIT_OPTIONS, type SearchLimit } from './searchLimit';

export function SearchLimitMenu(props: { readonly limit: SearchLimit; onLimitChange(limit: SearchLimit): void }) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Menu isOpen={isOpen} onOpenChange={setIsOpen}>
			<MenuTrigger
				aria-label={`Results per page: ${props.limit}`}
				className="h-8 w-fit gap-2 py-1.5 pr-2 pl-3 pressed:outline-2 pressed:outline-offset-2 pressed:outline-base-lavender-400 dark:pressed:outline-base-lavender-600"
				variant="discreet"
			>
				<span>
					Show: <span className="text-base-label-md">{props.limit}</span>
				</span>
				{isOpen ? (
					<ChevronUpIcon aria-hidden size={18} strokeWidth={1.5} />
				) : (
					<ChevronDownIcon aria-hidden size={18} strokeWidth={1.5} />
				)}
			</MenuTrigger>
			<MenuContent
				disallowEmptySelection
				placement="bottom"
				selectedKeys={new Set([String(props.limit)])}
				selectionMode="single"
				popover={{ arrow: false }}
			>
				{SEARCH_LIMIT_OPTIONS.map((limit) => (
					<MenuItem id={String(limit)} key={limit} onAction={() => props.onLimitChange(limit)}>
						{String(limit)}
					</MenuItem>
				))}
			</MenuContent>
		</Menu>
	);
}
