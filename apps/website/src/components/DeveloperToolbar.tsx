'use client';

import { useQueryClient } from '@tanstack/react-query';
import { CodeXmlIcon } from 'lucide-react';
import { Fragment, useState } from 'react';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@/components/ui/Menu';
import { ModalBody, ModalClose, ModalContent, ModalFooter, ModalHeader, ModalTitle } from '@/components/ui/Modal';
import { Separator } from '@/components/ui/Separator';
import { Switch } from '@/components/ui/Switch';
import { type FeatureFlagsData, useFeatureFlags } from '@/hooks/useFeatureFlags';
import { setFlag } from '@/server/actions/flags';

export function DeveloperToolbarFlagsExplorerDialog({
	isOpen,
	onOpenChange,
}: {
	readonly isOpen: boolean;
	onOpenChange(isOpen: boolean): void;
}) {
	const queryClient = useQueryClient();
	const { data: flagsData } = useFeatureFlags();

	return (
		<ModalContent isBlurred isOpen={isOpen} onOpenChange={onOpenChange}>
			<ModalHeader className="flex flex-row place-items-center gap-2 text-base-xl" hasBorder>
				<ModalTitle className="text-base-xl">Flags explorer</ModalTitle>
			</ModalHeader>
			<ModalBody className="max-h-[480px] min-h-[480px] py-0">
				{Object.entries(flagsData?.definitions ?? {}).map(([key, definition]) => (
					<Fragment key={key}>
						<div className="flex gap-1 py-4">
							<Switch
								isSelected={Boolean(flagsData?.values[key] ?? definition.defaultValue)}
								className="grow *:data-[slot=indicator]:col-start-2 *:data-[slot=label]:col-start-1 *:data-[slot=label]:row-start-1 *:[[slot=description]]:col-start-1 *:[[slot=description]]:row-start-2"
								label={key}
								description={definition.description}
								onChange={async (isSelected) => {
									queryClient.setQueryData<FeatureFlagsData | undefined>(['flags'], (oldData) => {
										if (!oldData) {
											return oldData;
										}

										return {
											...oldData,
											values: {
												...oldData.values,
												[key]: isSelected,
											},
										};
									});

									const [error] = await setFlag({ key, value: isSelected ? '1' : '0' });
									if (error) {
										queryClient.setQueryData<FeatureFlagsData | undefined>(['flags'], (oldData) => {
											if (!oldData) {
												return oldData;
											}

											return {
												...oldData,
												values: {
													...oldData.values,
													[key]: !isSelected,
												},
											};
										});
									} else {
										await queryClient.invalidateQueries({ queryKey: ['flags'] });
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
		<Menu>
			<MenuTrigger
				aria-label="Developer toolbar"
				className="fixed top-1/2 left-5 z-2147483647 -translate-y-1/2 pressed:outline-2 pressed:outline-offset-2 pressed:outline-base-lavender-400 dark:pressed:outline-base-lavender-600"
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
