'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CodeXmlIcon } from 'lucide-react';
import { Fragment, useState } from 'react';
import { setFlag } from '@/actions/flags';
import { Description, Label } from '@/components/ui/Field';
import { MenuItem, MenuTrigger, Menu, MenuContent } from '@/components/ui/Menu';
import { ModalClose, ModalBody, ModalFooter, ModalHeader, ModalContent } from '@/components/ui/Modal';
import { Separator } from '@/components/ui/Separator';
import { Switch } from '@/components/ui/Switch';

export function DeveloperToolbarFlagsExplorerDialog({
	isOpen,
	onOpenChange,
}: {
	readonly isOpen: boolean;
	onOpenChange(isOpen: boolean): void;
}) {
	const queryClient = useQueryClient();

	const { data: flagsData } = useQuery<{
		definitions: Record<string, { defaultValue?: boolean | number | string; description?: string }>;
		values: Record<string, boolean | number | string>;
	}>({
		queryKey: ['flags'],
		queryFn: async () => {
			const res = await fetch('/flags');
			return res.json();
		},
	});

	return (
		<ModalContent
			classNames={{ overlay: 'sm:place-content-start', content: 'sm:ml-14' }}
			isBlurred
			isOpen={isOpen}
			onOpenChange={onOpenChange}
		>
			<ModalHeader className="text-base-xl" hasBorder>
				Flags explorer
			</ModalHeader>
			<ModalBody className="max-h-[480px] min-h-[480px] py-6">
				{Object.entries(flagsData?.definitions ?? {}).map(([key, definition]) => (
					<Fragment key={key}>
						<div className="flex flex-col gap-1">
							<Label>{key}</Label>
							{definition.description && <Description>{definition.description}</Description>}
							<Switch
								isSelected={Boolean(flagsData?.values[key] ?? definition.defaultValue)}
								onChange={async (isSelected) => {
									queryClient.setQueryData(['flags'], (oldData: typeof flagsData) => ({
										...oldData,
										values: {
											...oldData?.values,
											[key]: isSelected,
										},
									}));

									try {
										await setFlag(key, isSelected ? '1' : '0');
										await queryClient.invalidateQueries({ queryKey: ['flags'] });
									} catch {
										queryClient.setQueryData(['flags'], (oldData: typeof flagsData) => ({
											...oldData,
											values: {
												...oldData?.values,
												[key]: !isSelected,
											},
										}));
									}
								}}
								size="sm"
								variant="green-lime"
							/>
						</div>
						<Separator className="m-0 -mx-6" />
					</Fragment>
				))}
			</ModalBody>
			<ModalFooter hasBorder>
				<ModalClose variant="secondary-discreet">Close</ModalClose>
			</ModalFooter>
		</ModalContent>
	);
}

export function DeveloperToolbarMenu() {
	const [isFlagsExplorerOpen, setIsFlagsExplorerOpen] = useState(false);

	return (
		<Menu respectScreen={false}>
			<MenuTrigger
				aria-label="Developer toolbar"
				className="pressed:outline-2 pressed:outline-offset-2 pressed:outline-base-lavender-400 dark:pressed:outline-base-lavender-600 fixed top-1/2 left-5 z-2147483647 -translate-y-1/2"
				size="icon-sm"
				variant="filled"
			>
				<CodeXmlIcon aria-hidden size={18} strokeWidth={1.5} />
			</MenuTrigger>
			<MenuContent placement="right">
				<MenuItem onAction={() => setIsFlagsExplorerOpen(true)}>Flags explorer</MenuItem>
			</MenuContent>

			<DeveloperToolbarFlagsExplorerDialog isOpen={isFlagsExplorerOpen} onOpenChange={setIsFlagsExplorerOpen} />
		</Menu>
	);
}
