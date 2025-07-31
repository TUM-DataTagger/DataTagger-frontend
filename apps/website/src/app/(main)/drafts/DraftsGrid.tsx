'use client';

import { format } from '@formkit/tempo';
import { useSetAtom } from 'jotai';
import { InfoIcon, Wand2Icon } from 'lucide-react';
import Link from 'next/link';
import { useQueryStates, parseAsBoolean, parseAsString, parseAsArrayOf } from 'nuqs';
import type { Selection } from 'react-aria-components';
import { useMediaQuery } from 'usehooks-ts';
import { FileExpirationBadge } from '@/components/File';
import { Button } from '@/components/ui/Button';
import { GridList, GridListItem } from '@/components/ui/GridList';
import { useSidebar } from '@/components/ui/Sidebar';
import { globalUploadAssistantOpenAtom } from '@/stores/globalUploadAssistant';
import { sideSheetSelectedDatasetAtom } from '@/stores/sideSheet';
import { gridCardStyles } from '@/styles/ui/gridCard';
import { convertDataRateLog } from '@/util/convertDataRate';
import { differenceInDays } from '@/util/differenceInDays';
import type { components } from '@/util/openapiSchema';
import { DraftsMoreMenu } from './DraftsMoreMenu';

type Draft = components['schemas']['UploadsDatasetList'];

export function DraftsGrid(props: { readonly data?: Draft[] | undefined }) {
	const [queryStates, setQueryStates] = useQueryStates({
		bulk_edit: parseAsBoolean.withDefault(false),
		selected: parseAsArrayOf(parseAsString).withDefault([]),
	});
	const isLarge = useMediaQuery('(min-width: 1024px)', { initializeWithValue: false });
	const { setOpen: setSidebarOpen } = useSidebar();
	const setIsGlobalUploadAssistantOpen = useSetAtom(globalUploadAssistantOpenAtom);
	const setSideSheetSelectedDataset = useSetAtom(sideSheetSelectedDatasetAtom);

	const handleSelectionChange = async (selectedKeys: Selection) => {
		const newSelected = Array.from(selectedKeys as Set<string>);
		await setQueryStates({ selected: newSelected.length ? newSelected : null });
	};

	return (
		<GridList
			aria-label="Draft files"
			className="layout-grid:gap-3.5"
			dependencies={[queryStates.bulk_edit]}
			items={props.data ?? []}
			layout="grid"
			onSelectionChange={handleSelectionChange}
			selectedKeys={queryStates.selected}
			selectionMode={queryStates.bulk_edit ? 'multiple' : 'none'}
		>
			{(item) => (
				<GridListItem
					className="cursor-pointer rounded-xl"
					classNames={{ checkbox: 'absolute top-[18px] right-[18px] z-10' }}
					hasCheckbox={queryStates.bulk_edit}
					href={queryStates.bulk_edit ? '' : `/drafts/${item.pk}`}
					id={item.pk}
					key={`${item.pk}-${queryStates.bulk_edit}`}
					textValue={item.display_name ?? 'Empty dataset'}
				>
					<div className="relative h-[182px] w-full min-w-64 gap-6 md:w-auto">
						{queryStates.bulk_edit ? null : (
							<div className="absolute top-2 right-2">
								<DraftsMoreMenu fileUuid={item.pk} filename={item.display_name} versionUuid={item.latest_version?.pk} />
							</div>
						)}
						<div className="absolute right-4 bottom-3">
							<Button
								aria-label="Open sidesheet"
								className="rounded-full"
								onPress={() => {
									setSidebarOpen(true);
									setSideSheetSelectedDataset(item.pk);
									if (!isLarge) {
										setIsGlobalUploadAssistantOpen(false);
									}
								}}
								size="icon-sm"
								variant="unset"
							>
								<InfoIcon aria-hidden size={18} strokeWidth={1.5} />
							</Button>
						</div>
						<div
							className={gridCardStyles({
								variant: 'link',
								className: 'pb-3',
							})}
						>
							<span className="flex grow flex-col place-content-between gap-6">
								<span className="flex flex-col gap-3">
									{queryStates.bulk_edit ? (
										<Link
											className="group-active:text-base-neutral-900 group-hover:text-base-lavender-600 group-hover:group-active:text-base-neutral-900 group-focus-visible:text-base-lavender-600 dark:group-active:text-base-neutral-40 dark:group-hover:text-base-lavender-400 dark:group-hover:group-active:text-base-neutral-40 dark:group-focus-visible:text-base-lavender-400 line-clamp-2 max-w-[25ch] break-words text-ellipsis"
											href={`/drafts/${item.pk}`}
										>
											{item.display_name ?? 'Empty dataset'}
										</Link>
									) : (
										<span className="group-active:text-base-neutral-900 group-hover:text-base-lavender-600 group-hover:group-active:text-base-neutral-900 group-focus-visible:text-base-lavender-600 dark:group-active:text-base-neutral-40 dark:group-hover:text-base-lavender-400 dark:group-hover:group-active:text-base-neutral-40 dark:group-focus-visible:text-base-lavender-400 line-clamp-2 max-w-[25ch] break-words text-ellipsis">
											{item.display_name ?? 'Empty dataset'}
										</span>
									)}
									<span>
										{convertDataRateLog(
											item?.latest_version?.version_file?.metadata?.find(
												(metadata) => metadata.custom_key === 'FILE_SIZE',
											)?.value as number | undefined,
										) ?? '...'}
									</span>
								</span>
								<span className="mb-1 flex flex-col gap-3">
									<span className="text-base-sm text-base-neutral-600 dark:text-base-neutral-300 inline-flex place-items-center gap-2">
										<Wand2Icon aria-hidden size={18} strokeWidth={1.5} />{' '}
										{format(item.creation_date, 'MMM D, YYYY hh:mm', 'en')}
									</span>
									{item.expiry_date && differenceInDays(item.expiry_date) <= 14 ? (
										<FileExpirationBadge expirationDate={item.expiry_date} />
									) : null}
								</span>
							</span>
						</div>
					</div>
				</GridListItem>
			)}
		</GridList>
	);
}
