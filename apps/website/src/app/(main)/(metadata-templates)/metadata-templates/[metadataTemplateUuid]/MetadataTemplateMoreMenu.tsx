'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { MoreVerticalIcon, PencilIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useMediaQuery } from 'usehooks-ts';
import { Drawer, DrawerBody, DrawerContent, DrawerTrigger } from '@/components/ui/Drawer';
import { dropdownItemStyles } from '@/components/ui/Dropdown';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@/components/ui/Menu';
import { useMetadataTemplatePermissions } from '@/hooks/useMetadataTemplatePermissions';
import { cx } from '@/styles/cva';
import { $api } from '@/util/clientFetch';
import { MetadataTemplateMoreMenuEditNameDialog } from './MetadataTemplateMoreMenuEditNameDialog';

export function MetadataTemplateMoreMenu(props: {
	readonly className?: string;
	readonly metadataTemplateUuid: string;
}) {
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });
	const [isEditNameOpen, setIsEditNameOpen] = useState(false);

	const { data: metadataTemplateData } = useSuspenseQuery(
		$api.queryOptions('get', '/api/v1/metadata-template/{id}/', {
			params: { path: { id: props.metadataTemplateUuid } },
		}),
	);

	const { isProjectMetadataTemplateAdmin, isFolderAdmin, isGlobalMetadataTemplateAdmin } =
		useMetadataTemplatePermissions({
			metadataTemplateUuid: props.metadataTemplateUuid,
		});

	if (!isProjectMetadataTemplateAdmin && !isFolderAdmin && !isGlobalMetadataTemplateAdmin) {
		return null;
	}

	return (
		<>
			{isMobile ? (
				<div>
					<Drawer withNotch={false}>
						<DrawerTrigger aria-label="More menu" size="icon" variant="filled">
							<MoreVerticalIcon aria-hidden size={24} strokeWidth={1.5} />
						</DrawerTrigger>
						<DrawerContent aria-label="More menu">
							<DrawerBody>
								<Link
									aria-label="Edit basic information"
									className={dropdownItemStyles({ className: 'text-base-sm flex gap-2' })}
									href={`/metadata-templates/${props.metadataTemplateUuid}/edit`}
									id="edit-basic-information"
								>
									<PencilIcon aria-hidden size={18} strokeWidth={1.5} /> Edit basic information
								</Link>
								<Link
									aria-label="Edit metadata"
									className={dropdownItemStyles({ className: 'text-base-sm flex gap-2' })}
									href={`/metadata-templates/${props.metadataTemplateUuid}/edit-metadata-fields`}
									id="edit-metadata-fields"
								>
									<PencilIcon aria-hidden size={18} strokeWidth={1.5} /> Edit metadata fields
								</Link>
							</DrawerBody>
						</DrawerContent>
					</Drawer>
				</div>
			) : (
				<Menu>
					<MenuTrigger
						aria-label="More menu"
						className={cx(
							'pressed:outline-2 pressed:outline-offset-2 pressed:outline-base-lavender-400 dark:pressed:outline-base-lavender-600 hidden md:flex',
							props.className,
						)}
						size="icon"
						variant="filled"
					>
						<MoreVerticalIcon aria-hidden size={18} strokeWidth={1.5} />
					</MenuTrigger>
					<MenuContent placement="bottom">
						<MenuItem
							aria-label="Edit name"
							id="edit"
							onAction={async () => {
								// const status = await isLocked();
								// if (status?.locked) {
								// 	setIsEditLockOpen(true);
								// }

								setIsEditNameOpen(true);
							}}
						>
							<PencilIcon aria-hidden size={18} strokeWidth={1.5} /> Edit name
						</MenuItem>
						<MenuItem
							aria-label="Edit metadata"
							href={`/metadata-templates/${props.metadataTemplateUuid}/edit-metadata-fields`}
							id="edit-metadata-fields"
						>
							<PencilIcon aria-hidden size={18} strokeWidth={1.5} /> Edit metadata fields
						</MenuItem>
					</MenuContent>
				</Menu>
			)}
			<MetadataTemplateMoreMenuEditNameDialog
				isOpen={isEditNameOpen}
				metadataTemplateUuid={props.metadataTemplateUuid}
				name={metadataTemplateData.name}
				onOpenChange={setIsEditNameOpen}
			/>
		</>
	);
}
