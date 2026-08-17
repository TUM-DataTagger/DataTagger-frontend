'use client';

import { FolderArchiveIcon, MoreVerticalIcon } from 'lucide-react';
import { useQueryStates } from 'nuqs';
import { useState } from 'react';
import { BulkActionsToolbar } from '@/components/BulkActionsToolbar';
import { MetadataTemplateExportDialog } from '@/components/metadata-template/MetadataTemplateExportDialog';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@/components/ui/Menu';
import { metadataTemplateBulkQueryState } from './metadataTemplateBulkQueryState';

export function MetadataTemplatesBulkActions({ currentPageUuids }: { readonly currentPageUuids: readonly string[] }) {
	const [queryStates, setQueryStates] = useQueryStates(metadataTemplateBulkQueryState);
	const [isExportOpen, setIsExportOpen] = useState(false);

	return (
		<>
			<BulkActionsToolbar count={currentPageUuids.length}>
				<Menu>
					<MenuTrigger aria-label="More bulk actions" size="icon-sm" variant="filled">
						<MoreVerticalIcon aria-hidden size={18} strokeWidth={1.5} />
					</MenuTrigger>
					<MenuContent placement="bottom" popover={{ arrow: false }}>
						<MenuItem
							aria-label="Export selected metadata templates"
							id="bulk-export"
							isDisabled={!queryStates.selected.length}
							onAction={() => setIsExportOpen(true)}
						>
							<FolderArchiveIcon aria-hidden size={18} strokeWidth={1.5} /> Export selected
						</MenuItem>
					</MenuContent>
				</Menu>
			</BulkActionsToolbar>
			<MetadataTemplateExportDialog
				containerUuids={queryStates.selected}
				isOpen={isExportOpen}
				onJobCreated={async () => {
					await setQueryStates({ bulk_edit: false, selected: [] });
				}}
				onOpenChange={setIsExportOpen}
				title="Export selected metadata templates"
			/>
		</>
	);
}
