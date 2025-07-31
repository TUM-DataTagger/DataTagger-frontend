'use client';

import { format } from '@formkit/tempo';
import { useSetAtom } from 'jotai';
import { InfoIcon, Wand2Icon } from 'lucide-react';
import Link from 'next/link';
import { parseAsArrayOf, parseAsBoolean, parseAsString, useQueryStates } from 'nuqs';
import type { Selection } from 'react-aria-components';
import { useMediaQuery } from 'usehooks-ts';
import { FileExpirationBadge } from '@/components/File';
import { Button } from '@/components/ui/Button';
import { useSidebar } from '@/components/ui/Sidebar';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@/components/ui/Table';
import { globalUploadAssistantOpenAtom } from '@/stores/globalUploadAssistant';
import { sideSheetSelectedDatasetAtom } from '@/stores/sideSheet';
import { buttonStyles } from '@/styles/ui/button';
import { convertDataRateLog } from '@/util/convertDataRate';
import { differenceInDays } from '@/util/differenceInDays';
import type { components } from '@/util/openapiSchema';
import { DraftsMoreMenu } from './DraftsMoreMenu';

type Draft = components['schemas']['UploadsDatasetList'];

export function DraftsTable(props: { readonly data?: Draft[] | undefined }) {
	const [queryStates, setQueryStates] = useQueryStates({
		bulk_edit: parseAsBoolean.withDefault(false),
		selected: parseAsArrayOf(parseAsString).withDefault([]),
	});
	const isLarge = useMediaQuery('(min-width: 1024px)', { initializeWithValue: false });
	const { setOpen: setSidebarOpen } = useSidebar();
	const setIsGlobalUploadAssistantOpen = useSetAtom(globalUploadAssistantOpenAtom);
	const setSideSheetSelectedDataset = useSetAtom(sideSheetSelectedDatasetAtom);

	const handleOpenSidesheet = (item: Draft) => {
		setSidebarOpen(true);
		setSideSheetSelectedDataset(item.pk);
		if (!isLarge) {
			setIsGlobalUploadAssistantOpen(false);
		}
	};

	const handleSelectionChange = async (selectedKeys: Selection) => {
		const newSelected = Array.from(selectedKeys as Set<string>);
		await setQueryStates({ selected: newSelected.length ? newSelected : null });
	};

	return (
		<Table
			aria-label="Draft files"
			onSelectionChange={handleSelectionChange}
			selectedKeys={queryStates.selected}
			selectionMode={queryStates.bulk_edit ? 'multiple' : 'none'}
		>
			<TableHeader className="hidden">
				<TableColumn id="display_name" isRowHeader style={{ width: '300px' }}>
					Name
				</TableColumn>
				<TableColumn id="size" style={{ width: '50px' }}>
					Size
				</TableColumn>
				<TableColumn id="creation_date" style={{ width: '150px' }}>
					Created at
				</TableColumn>
				<TableColumn id="expiry_date" style={{ width: '150px' }}>
					Expires at
				</TableColumn>
				<TableColumn id="sidesheet" style={{ width: '35px' }}>
					Open in sidesheet
				</TableColumn>
				<TableColumn id="actions" style={{ width: '35px' }}>
					Actions
				</TableColumn>
			</TableHeader>
			<TableBody items={props.data ?? []}>
				{(item) => (
					<TableRow href={`/drafts/${item.pk}`} id={item.pk}>
						<TableCell style={{ width: '300px' }} textValue={item.display_name ?? 'Empty dataset'}>
							<Link
								className={buttonStyles({
									variant: 'unset',
									className:
										'group-hover:text-base-lavender-600 dark:group-hover:text-base-lavender-400 print:inline-flex',
								})}
								href={`/drafts/${item.pk}`}
							>
								<span className="max-w-[30ch] truncate">{item.display_name ?? 'Empty dataset'}</span>
							</Link>
						</TableCell>
						<TableCell style={{ width: '50px' }} textValue={item.display_name ?? 'Empty dataset'}>
							<div className="text-center">
								{convertDataRateLog(
									item?.latest_version?.version_file?.metadata?.find((metadata) => metadata.custom_key === 'FILE_SIZE')
										?.value as number | undefined,
								) ?? '...'}
							</div>
						</TableCell>
						<TableCell style={{ width: '150px' }} textValue={item.display_name ?? 'Empty dataset'}>
							<span className="text-base-sm text-base-neutral-600 dark:text-base-neutral-300 inline-flex h-full place-items-center gap-2">
								<Wand2Icon aria-hidden size={18} strokeWidth={1.5} />{' '}
								{format(item.creation_date, 'MMM D, YYYY hh:mm', 'en')}
							</span>
						</TableCell>
						<TableCell style={{ width: '150px' }} textValue={item.display_name ?? 'Empty dataset'}>
							{item.expiry_date && differenceInDays(item.expiry_date) <= 14 ? (
								<FileExpirationBadge expirationDate={item.expiry_date} />
							) : null}
						</TableCell>
						<TableCell style={{ width: '35px' }} textValue={item.display_name ?? 'Empty dataset'}>
							<div className="flex place-content-end">
								<Button
									aria-label="Open sidesheet"
									className="rounded-full"
									onPress={() => handleOpenSidesheet(item)}
									variant="unset"
								>
									<InfoIcon aria-hidden size={18} strokeWidth={1.5} />
								</Button>
							</div>
						</TableCell>
						<TableCell style={{ width: '35px' }} textValue={item.display_name ?? 'Empty dataset'}>
							<div className="flex place-content-end">
								<DraftsMoreMenu fileUuid={item.pk} filename={item.display_name} versionUuid={item.latest_version?.pk} />
							</div>
						</TableCell>
					</TableRow>
				)}
			</TableBody>
		</Table>
	);
}
